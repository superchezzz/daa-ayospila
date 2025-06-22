import React, { useState } from 'react';
import './AddRegistrant.css';

const serviceData = [
  {
    category: "Driver's License Services",
    services: ["New Driver's License (Non-Professional)", "New Driver's License (Professional)", "Driver's License Renewal", "Student Permit Application", "Duplicate License"]
  },
  {
    category: "Vehicle Registration Services",
    services: ["New Vehicle Registration", "Vehicle Registration Renewal", "Transfer Of Ownership"]
  },
  {
    category: "Official Documents",
    services: ["OR/CR Request", "Clearance Certificate"]
  },
  {
    category: "Testing Services",
    services: ["Written Exam Scheduling","Driving Test Scheduling"]
  }
];

function AddRegistrant() {
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [category, setCategory] = useState('');
  const [urgency, setUrgency] = useState(1);
  const [hasAppointment, setHasAppointment] = useState('no');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [selectedServices, setSelectedServices] = useState({});

  const handleServiceChange = (event) => {
    const { name, checked } = event.target;
    setSelectedServices(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const registrantData = {
      fullName,
      contactNumber,
      category,
      urgency,
      appointment: {
        status: hasAppointment,
        date: hasAppointment === 'yes' ? appointmentDate : null,
        time: hasAppointment === 'yes' ? appointmentTime : null,
      },

      services: Object.keys(selectedServices).filter(key => selectedServices[key]),
    };
    
    console.log("Form Data to be sent to Backend:", registrantData);
    // TODO: Send registrantData to your backend API
    // fetch('/api/registrants', { method: 'POST', body: JSON.stringify(registrantData) })
  };

  return (
    <div className="add-registrant-container">
      <h2 className="main-title">Add New Registrant</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-top-row">
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input type="text" id="fullName" placeholder="Enter Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="contactNumber">Contact Number</label>
            <input type="text" id="contactNumber" placeholder="09XX-XXX-XXXX" value={contactNumber} onChange={e => setContactNumber(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select id="category" value={category} onChange={e => setCategory(e.target.value)} required>
              <option value="" disabled>Select Category</option>
              <option value="Regular">Regular</option>
              <option value="Senior Citizen">Senior Citizen</option>
              <option value="PWD">PWD</option>
              <option value="Pregnant">Pregnant</option>
            </select>
          </div>
          <div className="form-group">
            <label>Custom Urgency Level</label>
            <div className="urgency-selector">
              {[1, 2, 3, 4, 5].map(level => (
                <div key={level} className={`urgency-box ${urgency === level ? 'active' : ''}`} onClick={() => setUrgency(level)}>
                  {level}
                </div>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Appointment</label>
            <div className="appointment-controls">
              <div className="radio-group">
                <input type="radio" id="app-yes" name="appointment" value="yes" checked={hasAppointment === 'yes'} onChange={e => setHasAppointment(e.target.value)} />
                <label htmlFor="app-yes">Yes</label>
                <input type="radio" id="app-no" name="appointment" value="no" checked={hasAppointment === 'no'} onChange={e => setHasAppointment(e.target.value)} />
                <label htmlFor="app-no">No</label>
              </div>
              {hasAppointment === 'yes' && (
                <div className="date-time-inputs">
                  <input type="time" value={appointmentTime} onChange={e => setAppointmentTime(e.target.value)} />
                  <input type="date" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="services-section">
          <h3 className="section-title">Selected Required Services</h3>
          {serviceData.map(({ category, services }) => (
            <div className="service-category-box" key={category}>
              <h4 className="service-title">{category}</h4>
              <div className="service-options">
          
                <div className="options-list">
                  {services.map(service => (
                    <label key={service}>
                      <input 
                        type="checkbox" 
                        name={service}
                        checked={!!selectedServices[service]}
                        onChange={handleServiceChange}
                      /> 
                      {service}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button type="submit" className="add-registrant-button">Add Registrant</button>
      </form>
    </div>
  );
}

export default AddRegistrant;