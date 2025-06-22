import uuid
import datetime
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func

# Create the main Flask application object.
app = Flask(__name__)

### --- DATABASE CONFIGURATION --- ###
# This section is the "GPS address" that tells the app how to find and log into the MySQL database.
DB_USER = 'root'
DB_PASSWORD = 'YOUR_ROOT_PASSWORD' # I have put back your password from the screenshot. Change if needed.
DB_HOST = 'localhost'
DB_NAME = 'lto_queue_db'

# This line builds the full connection address string.
app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}'

# This is a standard setting for SQLAlchemy to prevent unnecessary warnings.
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# This creates the main SQLAlchemy object, our "database translator".
# We will use this 'db' object for all our database operations.
db = SQLAlchemy(app)

# This class is a Python blueprint that defines the structure of our 'customers'
# table in the MySQL database. SQLAlchemy will read this blueprint to understand
# our data.
class Customer(db.Model):
    # The name of the table in our MySQL database.
    __tablename__ = 'customers'

    # Define the columns (the fields) for our table.
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    queue_number = db.Column(db.String(10), nullable=False, unique=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    service = db.Column(db.String(100), nullable=True)
    urgency = db.Column(db.Integer, default=1)
    has_appointment = db.Column(db.Boolean, default=False)
    initial_priority_score = db.Column(db.Integer, nullable=False)

    # This 'status' column is crucial. It acts as a tag to track where each
    # customer is in the process.
    status = db.Column(db.String(20), nullable=False, default='waiting') # Can be 'waiting', 'serving', or 'completed'

    # Timestamps to track arrival and completion times.
    arrival_timestamp = db.Column(db.DateTime, nullable=False, default=datetime.datetime.now)
    completion_timestamp = db.Column(db.DateTime, nullable=True) # Will be null until they are served.


# These are helper functions that contain the main business logic and algorithms.

def quick_sort(arr):
    """
    PURPOSE: To sort the customer queue using a custom QuickSort algorithm
    - It takes a list of customer dictionaries as input.
    - It sorts that list in descending order (highest score comes first).
    - The sorting key is the nested 'score' value, which is accessed via
      x['priority']['score'] for each customer dictionary 'x'.
    """
    if len(arr) <= 1:
        return arr
    else:
        # We choose the middle element of the list as our pivot.
        pivot = arr[len(arr) // 2]
        
        # Partition the list into three separate lists based on the pivot's score:
        # 1. 'left':  All customers with a higher score than the pivot.
        # 2. 'middle': All customers with the exact same score as the pivot.
        # 3. 'right':  All customers with a lower score than the pivot.
        left = [x for x in arr if x['priority']['score'] > pivot['priority']['score']]
        middle = [x for x in arr if x['priority']['score'] == pivot['priority']['score']]
        right = [x for x in arr if x['priority']['score'] < pivot['priority']['score']]
        
        # Recursively call quick_sort on the 'left' and 'right' partitions
        # and then combine the sorted lists to get the final result.
        return quick_sort(left) + middle + quick_sort(right)


def calculate_priority_score(customer_data):
    """
    PURPOSE: To calculate a customer's INITIAL score the moment they register.
    This function contains the base rules of the priority system.
    """
    score = 0
    category_points = {"PWD": 5, "Senior Citizen": 4, "Pregnant": 4, "Regular": 1}
    score += category_points.get(customer_data.get("customerCategory", "Regular"), 1)
    score += (customer_data.get("customUrgencyLevel", 1) * 2)
    if customer_data.get("hasAppointment", False):
        score += 2
    return score

def get_dynamic_score(customer):
    """
    PURPOSE: To calculate a customer's LIVE, real-time score.
    This function is called every time we display the queue to ensure the
    scores are always up-to-date with wait-time bonuses.
    """
    now = datetime.datetime.now()
    wait_time_minutes = int((now - customer.arrival_timestamp).total_seconds() / 60)
    dynamic_score = customer.initial_priority_score
    if wait_time_minutes >= 30: dynamic_score += 5
    elif wait_time_minutes >= 20: dynamic_score += 3
    elif wait_time_minutes >= 10: dynamic_score += 1
    if customer.category == "Regular" and wait_time_minutes >= 25:
         dynamic_score += 3
    return dynamic_score, wait_time_minutes


# These functions define the URLs that our frontend can connect to.
# They handle incoming requests, use our helper functions and database,
# and send back responses.

@app.route('/api/customers', methods=['POST'])
def add_customer():
    """
    ENDPOINT PURPOSE: To register a new customer and add them to the queue.
    This is triggered when the user submits the "Add Registrant" form.
    """
    data = request.get_json()
    if not data or 'fullName' not in data or 'customerCategory' not in data:
        return jsonify({"error": "Missing required fields"}), 400
    initial_score = calculate_priority_score(data)
    total_customers = db.session.query(func.count(Customer.id)).scalar()
    queue_number_val = f"{data['customerCategory'][:1].upper()}-{total_customers + 1:03d}"
    new_customer = Customer(
        queue_number=queue_number_val, name=data["fullName"], category=data["customerCategory"],
        service=data.get("serviceType", "N/A"), urgency=data.get("customUrgencyLevel", 1),
        has_appointment=data.get("hasAppointment", False), initial_priority_score=initial_score
    )
    db.session.add(new_customer)
    db.session.commit()
    return jsonify({
        "success": True,
        "customer": { "queueNumber": new_customer.queue_number, "fullName": new_customer.name,
                      "priorityScore": new_customer.initial_priority_score }
    }), 201


@app.route('/api/queue', methods=['GET'])
def get_queue_status():
    """
    ENDPOINT PURPOSE: To get the complete, real-time state of the queue.
    This is what the "Queue Status" page will call to get its data.
    """
    # 1. Query the database to get the person being served and everyone waiting.
    currently_serving_customer = Customer.query.filter_by(status='serving').first()
    waiting_customers_db = Customer.query.filter_by(status='waiting').all()

    # 2. Loop through the waiting customers to calculate their live scores and wait times.
    queue_with_dynamic_scores = []
    alerts = []
    for customer in waiting_customers_db:
        score, wait_time = get_dynamic_score(customer) # Use our "brain"
        cust_dict = {
            "id": customer.id, "queueNumber": customer.queue_number, "name": customer.name,
            "category": customer.category, "service": customer.service, "urgency": customer.urgency,
            "priority": {"score": score, "level": "High" if score >= 12 else "Medium" if score >= 8 else "Low"},
            "waitTime": wait_time
        }
        queue_with_dynamic_scores.append(cust_dict)
        if wait_time >= 10 and customer.category == "Regular":
            bonus = 5 if wait_time >=30 else 3 if wait_time >= 20 else 1
            alerts.append({"message": f"{customer.name} (Regular) - {wait_time} Minute Wait (+{bonus} Aging Bonus)"})

    # 3. Use our custom QuickSort function to sort the list based on the new dynamic scores.
    sorted_queue = quick_sort(queue_with_dynamic_scores)

    # 4. Prepare the final data package and send it to the frontend as JSON.
    serving_response = None
    if currently_serving_customer:
        score, _ = get_dynamic_score(currently_serving_customer)
        serving_response = {
            "queueNumber": currently_serving_customer.queue_number, "fullName": currently_serving_customer.name,
            "service": currently_serving_customer.service, "category": currently_serving_customer.category, "score": score
        }

    return jsonify({
        "currentlyServing": serving_response,
        "queue": sorted_queue, # Return the list sorted by QuickSort
        "antiStarvationAlerts": alerts
    })


@app.route('/api/queue/serve-next', methods=['POST'])
def serve_next_customer():
    """
    ENDPOINT PURPOSE: To serve the next person in the queue.
    This is triggered by the "Serve Next Customer" button.
    """
    # 1. Find the person who is currently being served.
    currently_serving = Customer.query.filter_by(status='serving').first()
    if currently_serving:
        # 2. If someone was being served, change their status to 'completed'.
        currently_serving.status = 'completed'
        currently_serving.completion_timestamp = datetime.datetime.now()

    # 3. Get all customers who are waiting.
    waiting_customers_db = Customer.query.filter_by(status='waiting').all()
    if not waiting_customers_db:
        db.session.commit() # Save the change if we just completed someone.
        return jsonify({"success": True, "nowServing": None})

    # 4. Build a temporary list with dynamic scores to prepare for sorting.
    queue_with_dynamic_scores = []
    for customer in waiting_customers_db:
        score, _ = get_dynamic_score(customer)
        queue_with_dynamic_scores.append({
            "id": customer.id,
            "priority": {"score": score}
        })

    # 5. Use our custom QuickSort function to find the winner.
    sorted_queue = quick_sort(queue_with_dynamic_scores)

    # 6. Get the ID of the top customer, fetch their full record from the DB,
    #    and change their status to 'serving'.
    next_customer_id = sorted_queue[0]['id']
    next_customer_object = Customer.query.get(next_customer_id)
    next_customer_object.status = 'serving'

    # 7. Commit all the status changes to the database.
    db.session.commit()

    return jsonify({"success": True, "nowServing": {"queueNumber": next_customer_object.queue_number, "fullName": next_customer_object.name}})


@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """
    ENDPOINT PURPOSE: To calculate and return all statistics for the Analytics page.
    """
    total_customers = db.session.query(func.count(Customer.id)).scalar()
    current_queue_length = Customer.query.filter_by(status='waiting').count()
    completed_customers = Customer.query.filter_by(status='completed').all()
    total_wait_time = 0
    for cust in completed_customers:
        if cust.completion_timestamp:
            total_wait_time += (cust.completion_timestamp - cust.arrival_timestamp).total_seconds() / 60
    avg_wait_time = (total_wait_time / len(completed_customers)) if completed_customers else 0
    return jsonify({
        "ltoServiceAnalytics": { "totalCustomersToday": total_customers, "averageWaitTime": round(avg_wait_time),
            "priorityCustomersServed": Customer.query.filter(Customer.status=='completed', Customer.category!='Regular').count(),
            "currentQueueLength": current_queue_length },
        "fairnessMetrics": { }
    })

# This block is a special command to initialize the application context.
with app.app_context():
    # This looks at all the 'db.Model' classes
    # and creates the actual tables in our MySQL 
    # database if they don't already exist.
    db.create_all()

if __name__ == '__main__':
    # This command starts the Flask development web server.
    app.run(host='0.0.0.0', port=5001, debug=True)