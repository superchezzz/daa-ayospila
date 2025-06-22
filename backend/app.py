import uuid
import datetime
import heapq      
import threading  
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func
from flask_cors import CORS

# --- Setup and Configuration ---
app = Flask(__name__)
CORS(app) # Enable Cross-Origin Resource Sharing for the frontend

# Database Configuration
DB_USER = 'root'
DB_PASSWORD = 'mysqlpassword1234' # Your MySQL root password
DB_HOST = 'localhost'
DB_NAME = 'lto_queue_db'
app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- Database Model ---
# This class defines the 'customers' table in MySQL. 
class Customer(db.Model):
    __tablename__ = 'customers'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    queue_number = db.Column(db.String(10), nullable=False, unique=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    service = db.Column(db.Text, nullable=True) # Text type for multiple services
    urgency = db.Column(db.Integer, default=1)
    has_appointment = db.Column(db.Boolean, default=False)
    initial_priority_score = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='waiting')
    arrival_timestamp = db.Column(db.DateTime, nullable=False, default=datetime.datetime.now)
    completion_timestamp = db.Column(db.DateTime, nullable=True)

    __table_args__ = {'extend_existing': True}

# --- The In-Memory Priority Queue ---
class PriorityQueue:
    def __init__(self):
        self._queue = []
        self._lock = threading.Lock() # Prevents issues if multiple requests come at once

    def push(self, customer_obj):
        # We must calculate the score before adding the customer to the heap
        score, _ = get_dynamic_score(customer_obj)
        with self._lock:
            # heapq is a min-heap, so we use negative score to find the max score.
            # We also add arrival_timestamp as a tie-breaker.
            heapq.heappush(self._queue, (-score, customer_obj.arrival_timestamp, customer_obj.id))

    def pop(self):
        with self._lock:
            while self._queue:
                # Get the item with the highest priority (lowest negative number)
                _neg_score, _arrival, customer_id = heapq.heappop(self._queue)
                
                # Because scores change with time, we must re-validate before returning.
                customer = Customer.query.get(customer_id)
                if customer and customer.status == 'waiting':
                    # Recalculate the score with the current time
                    current_score, _ = get_dynamic_score(customer)
                    
                    # If the popped score is still the highest, we have our winner.
                    if -_neg_score >= current_score - 1: # Allow for small timing variations
                        return customer
                    else:
                        # The score changed and this person is no longer highest priority.
                        # Put them back in the heap with their new score and try again.
                        self.push(customer)
            return None # The queue is empty

    def get_all_item_ids(self):
        # Returns a list of all customer IDs currently in the heap.
        with self._lock:
            return [customer_id for _, _, customer_id in self._queue]

# A single, global instance of our Priority Queue that the whole app will use.
live_priority_queue = PriorityQueue()

# --- Core Logic & Algorithms ---

def calculate_priority_score(customer_data):
    score = 0
    category_points = {"PWD": 5, "Senior Citizen": 4, "Pregnant": 4, "Regular": 1}
    score += category_points.get(customer_data.get("customerCategory", "Regular"), 1)
    score += (customer_data.get("customUrgencyLevel", 1) * 2)
    if customer_data.get("hasAppointment", False):
        score += 2
    return score

def get_dynamic_score(customer):
    now = datetime.datetime.now()
    wait_time_minutes = int((now - customer.arrival_timestamp).total_seconds() / 60)
    dynamic_score = customer.initial_priority_score
    if wait_time_minutes >= 30: dynamic_score += 5
    elif wait_time_minutes >= 20: dynamic_score += 3
    elif wait_time_minutes >= 10: dynamic_score += 1
    if customer.category == "Regular" and wait_time_minutes >= 25:
         dynamic_score += 3
    return dynamic_score, wait_time_minutes

def quick_sort(arr):
    if len(arr) <= 1: return arr
    else:
        pivot = arr[len(arr) // 2]
        left = [x for x in arr if x['priority']['score'] > pivot['priority']['score']]
        middle = [x for x in arr if x['priority']['score'] == pivot['priority']['score']]
        right = [x for x in arr if x['priority']['score'] < pivot['priority']['score']]
        return quick_sort(left) + middle + quick_sort(right)

# --- API Endpoints ---

@app.route('/api/customers', methods=['POST'])
def add_customer():
    data = request.get_json()
    if not data or 'fullName' not in data or 'category' not in data:
        return jsonify({"error": "Missing required fields"}), 400

    # Process frontend data to match backend needs
    appointment_data = data.get('appointment', {})
    has_appointment_bool = appointment_data.get('status') == 'yes'
    services_list = data.get('services', [])
    services_string = ", ".join(services_list)
    processed_data_for_scoring = {
        "customerCategory": data.get("category"),
        "customUrgencyLevel": data.get("urgency"),
        "hasAppointment": has_appointment_bool
    }
    initial_score = calculate_priority_score(processed_data_for_scoring)
    
    total_customers = db.session.query(func.count(Customer.id)).scalar()
    queue_number_val = f"{data['category'][:1].upper()}-{total_customers + 1:03d}"

    # 1. Save the new customer to the MySQL database (permanent record).
    new_customer = Customer(
        queue_number=queue_number_val, name=data["fullName"], category=data["category"],
        service=services_string, urgency=data.get("urgency", 1),
        has_appointment=has_appointment_bool, initial_priority_score=initial_score
    )
    db.session.add(new_customer)
    db.session.commit()

    # 2. Add the new customer to our live, in-memory Priority Queue.
    live_priority_queue.push(new_customer)
    
    return jsonify({
        "success": True,
        "customer": { "queueNumber": new_customer.queue_number, "fullName": new_customer.name,
                      "priorityScore": new_customer.initial_priority_score }
    }), 201


# In app.py, replace the old get_queue_status function with this one.

@app.route('/api/queue', methods=['GET'])
def get_queue_status():
    currently_serving_customer = Customer.query.filter_by(status='serving').first()

    # Check if the in-memory queue is empty
    if not live_priority_queue.get_all_item_ids():
        # If it's empty, check if there are actually people waiting in the database
        waiting_in_db = Customer.query.filter_by(status='waiting').count()
        if waiting_in_db > 0:
            # If so, it means our in-memory heap is out of sync. Let's re-initialize it.
            print("In-memory queue is empty but DB has waiting customers. Re-initializing...")
            initialize_queue()
    
    # 1. Get the list of all customer IDs from our live in-memory heap.
    all_waiting_ids = live_priority_queue.get_all_item_ids()
    
    # 2. Get the full customer objects from the database for these IDs.
    # We use a dictionary for quick lookups.
    customers_by_id = {str(c.id): c for c in Customer.query.filter(Customer.id.in_(all_waiting_ids)).all()}

    # 3. Build the display list with fresh dynamic scores.
    queue_for_display = []
    alerts = []
    
    # We iterate through the IDs from the heap to maintain a semblance of heap order
    for cust_id in all_waiting_ids:
        customer = customers_by_id.get(cust_id)
        if customer:
            score, wait_time = get_dynamic_score(customer)
            queue_for_display.append({
                "id": customer.id, "queueNumber": customer.queue_number, "name": customer.name,
                "category": customer.category, "service": customer.service, "urgency": customer.urgency,
                "priority": {"score": score, "level": "High" if score >= 12 else "Medium" if score >= 8 else "Low"},
                "waitTime": wait_time
            })
            if wait_time >= 10 and customer.category == "Regular":
                bonus = 5 if wait_time >=30 else 3 if wait_time >= 20 else 1
                alerts.append({"message": f"{customer.name} (Regular) - {wait_time} Minute Wait (+{bonus} Aging Bonus)"})

    # 4. Use our QuickSort algorithm to sort the list for display.
    sorted_queue = quick_sort(queue_for_display)

    # Prepare the data for the 'currently serving' card
    serving_response = None
    if currently_serving_customer:
        score, _ = get_dynamic_score(currently_serving_customer)
        serving_response = { "queueNumber": currently_serving_customer.queue_number, "fullName": currently_serving_customer.name,
                             "service": currently_serving_customer.service, "category": currently_serving_customer.category, "score": score }

    return jsonify({ "currentlyServing": serving_response, "queue": sorted_queue, "antiStarvationAlerts": alerts })


@app.route('/api/queue/serve-next', methods=['POST'])
def serve_next_customer():
    # Update the person who was previously being served to 'completed'
    currently_serving = Customer.query.filter_by(status='serving').first()
    if currently_serving:
        currently_serving.status = 'completed'
        currently_serving.completion_timestamp = datetime.datetime.now()

    # Pop the highest-priority customer from our live in-memory heap (very fast).
    next_customer_to_serve = live_priority_queue.pop()
    
    if next_customer_to_serve:
        # Update their status to 'serving' in the permanent database.
        next_customer_to_serve.status = 'serving'
        db.session.commit()
        return jsonify({"success": True, "nowServing": {"queueNumber": next_customer_to_serve.queue_number, "fullName": next_customer_to_serve.name}})
    else:
        # If the heap was empty, we still need to save the change for the person who was completed.
        db.session.commit()
        return jsonify({"success": True, "nowServing": None})


@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    # Use database queries to efficiently calculate statistics.
    total_customers = db.session.query(func.count(Customer.id)).scalar()
    current_queue_length = Customer.query.filter_by(status='waiting').count()
    completed_customers = Customer.query.filter_by(status='completed').all()

    # Calculate overall average wait time
    total_wait_time = 0
    for cust in completed_customers:
        if cust.completion_timestamp:
            total_wait_time += (cust.completion_timestamp - cust.arrival_timestamp).total_seconds() / 60
    avg_wait_time = (total_wait_time / len(completed_customers)) if completed_customers else 0

    # Create lists to hold the wait times for each category
    pwd_wait_times = []
    senior_wait_times = []
    pregnant_wait_times = []
    emergency_wait_times = []
    
    # Loop through completed customers to gather their wait times by category
    for cust in completed_customers:
        if cust.completion_timestamp:
            wait_minutes = (cust.completion_timestamp - cust.arrival_timestamp).total_seconds() / 60
            if cust.category == 'PWD':
                pwd_wait_times.append(wait_minutes)
            elif cust.category == 'Senior Citizen':
                senior_wait_times.append(wait_minutes)
            elif cust.category == 'Pregnant':
                pregnant_wait_times.append(wait_minutes)

            if cust.urgency == 5:
                emergency_wait_times.append(wait_minutes)

    # Helper function to safely calculate the average, avoiding division by zero
    def calculate_avg(times_list):
        return sum(times_list) / len(times_list) if times_list else 0

    # Calculate the average for each category
    avg_pwd_wait = calculate_avg(pwd_wait_times)
    avg_senior_wait = calculate_avg(senior_wait_times)
    avg_pregnant_wait = calculate_avg(pregnant_wait_times)
    avg_emergency_wait = calculate_avg(emergency_wait_times)

    # Package ALL the stats and send them back.
    return jsonify({
        "ltoServiceAnalytics": {
            "totalCustomersToday": total_customers,
            "averageWaitTime": round(avg_wait_time),
            "priorityCustomersServed": Customer.query.filter(Customer.status=='completed', Customer.category!='Regular').count(),
            "currentQueueLength": current_queue_length
        },
        "fairnessMetrics": {
            "pwdAverageWaitTime": round(avg_pwd_wait),
            "seniorCitizenAverageWaitTime": round(avg_senior_wait),
            "pregnantAverageWaitTime": round(avg_pregnant_wait),
            "emergencyResponseTime": round(avg_emergency_wait)
        }
    })

# --- Final Setup and Execution ---

def initialize_queue():
    """
    This function runs once when the server starts to populate our in-memory
    Priority Queue from the permanent database. This ensures that if the server
    crashed, the queue is restored on restart.
    """
    with app.app_context():
        print("Initializing live queue from database...")
        waiting_customers = Customer.query.filter(Customer.status == 'waiting').all()
        for customer in waiting_customers:
            live_priority_queue.push(customer)
        print(f"Queue initialized with {len(waiting_customers)} waiting customers.")

# This line ensures the database tables are created based on our Customer model.
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    # Initialize our live queue from the database before starting the server.
    initialize_queue()
    # Start the Flask development web server.
    app.run(host='0.0.0.0', port=5001, debug=True)

