import { useEffect, useState } from 'react';
import axios from '../api/axios.js';

export default function Schools() {
  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState({
    name: '',
    location: '',
    principalName: '',
    contactEmail: '',
    numberOfRooms: '',
    phone: '',
    address: '',
    notes: '',
  });

  const load = () => axios.get('/api/schools').then((r) => setSchools(r.data));

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    await axios.post('/api/schools', {
      ...form,
      numberOfRooms: Number(form.numberOfRooms) || 0,
    });
    setForm({
      name: '',
      location: '',
      principalName: '',
      contactEmail: '',
      numberOfRooms: '',
      phone: '',
      address: '',
      notes: '',
    });
    load();
  };

  return (
    <div className="page-padding">
      <div className="two-col">
        <div className="card card-pad">
          <h2 className="title-font section-title">Register School</h2>
          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">School Name</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                className="form-input"
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Principal Name</label>
              <input
                className="form-input"
                value={form.principalName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, principalName: e.target.value }))
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input
                className="form-input"
                type="email"
                value={form.contactEmail}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contactEmail: e.target.value }))
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">No. of Classrooms</label>
              <input
                className="form-input"
                type="number"
                min="0"
                value={form.numberOfRooms}
                onChange={(e) =>
                  setForm((f) => ({ ...f, numberOfRooms: e.target.value }))
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                className="form-input"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Full Address</label>
              <textarea
                className="form-textarea"
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <button type="submit" className="btn-primary">
              Submit
            </button>
          </form>
        </div>
        <div>
          {schools.map((s) => (
            <div key={s._id} className="card card-pad dashboard-stack-margin">
              <div className="lb-row school-card-head">
                <div className="school-mini-name">{s.name}</div>
                <span className="badge badge-open">{s.status || 'active'}</span>
              </div>
              <div className="school-mini-loc">{s.location}</div>
              <div className="stats-grid school-stats-grid">
                <div>
                  <div className="stat-card-label">Rooms</div>
                  <div className="title-font">{s.numberOfRooms}</div>
                </div>
                <div>
                  <div className="stat-card-label">Students</div>
                  <div className="title-font">
                    {s.notes?.split('·')[0]?.trim().split(' ')[0] || '—'}
                  </div>
                </div>
                <div>
                  <div className="stat-card-label">Teachers</div>
                  <div className="title-font">
                    {s.notes?.split('·')[1]?.trim().split(' ')[0] || '—'}
                  </div>
                </div>
                <div>
                  <div className="stat-card-label">Cameras</div>
                  <div className="title-font">2</div>
                </div>
              </div>
              <div className="lb-row school-card-actions">
                <button type="button" className="btn-secondary btn-sm">
                  View Details
                </button>
                <button type="button" className="btn-ghost btn-sm">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
