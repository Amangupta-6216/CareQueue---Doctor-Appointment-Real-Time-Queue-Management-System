import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Users, UserCheck, Stethoscope, Activity, TrendingUp, AlertTriangle, ShieldCheck, Plus, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [usersList, setUsersList] = useState([]);
  
  // Forms state
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showRecepModal, setShowRecepModal] = useState(false);

  const [docForm, setDocForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    department: 'General Medicine',
    specialization: '',
    consultationFee: 500
  });

  const [recepForm, setRecepForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  const departments = ['General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Dermatology', 'ENT'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reportsRes, docsRes, usersRes] = await Promise.all([
        api.get('/admin/reports/summary'),
        api.get('/doctors'),
        api.get('/users')
      ]);
      setReports(reportsRes.data);
      setDoctors(docsRes.data);
      setUsersList(usersRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    try {
      await api.post('/doctors', docForm);
      setMessage({ type: 'success', text: `Doctor ${docForm.name} created successfully!` });
      setShowDoctorModal(false);
      setDocForm({
        name: '', email: '', password: '', phone: '',
        department: 'General Medicine', specialization: '', consultationFee: 500
      });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error creating doctor.' });
    }
  };

  const handleCreateRecep = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/receptionists', recepForm);
      setMessage({ type: 'success', text: `Receptionist ${recepForm.name} account created!` });
      setShowRecepModal(false);
      setRecepForm({ name: '', email: '', password: '', phone: '' });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error creating receptionist.' });
    }
  };

  const handleDeleteDoctor = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this doctor?')) return;
    try {
      await api.delete(`/doctors/${docId}`);
      setMessage({ type: 'success', text: 'Doctor deleted.' });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete doctor.' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Super Administrator</span>
          <h1 className="text-2xl font-black text-white mt-1">System Governance & Analytics</h1>
          <p className="text-xs text-slate-400 mt-1">Manage hospital staff, view real-time metrics, and override queues.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowDoctorModal(true)}
            className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-sky-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Onboard Doctor
          </button>
          <button
            onClick={() => setShowRecepModal(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Receptionist
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Analytics KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Patients</span>
          <div className="text-2xl font-black text-white">{reports?.totalPatients || 0}</div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Doctors</span>
          <div className="text-2xl font-black text-sky-400">{reports?.totalDoctors || 0}</div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Today's Appointments</span>
          <div className="text-2xl font-black text-emerald-400">{reports?.totalAppointmentsToday || 0}</div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">No-Show Rate</span>
          <div className="text-2xl font-black text-rose-400">{reports?.noShowRate || '0%'}</div>
        </div>
      </div>

      {/* Doctors Roster Management Table */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-sky-400" />
          Hospital Doctors Roster & Availability
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Doctor Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Specialization</th>
                <th className="py-3 px-4">Consultation Fee</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {doctors.map(doc => (
                <tr key={doc._id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-white">{doc.user?.name || 'Dr. Specialist'}</td>
                  <td className="py-3 px-4 text-sky-400 font-semibold">{doc.department}</td>
                  <td className="py-3 px-4 text-slate-400">{doc.specialization}</td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">${doc.consultationFee}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      doc.onLeave ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {doc.onLeave ? 'On Leave' : 'Active'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteDoctor(doc._id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Doctor Leave Requests Approval Section */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-400" />
          Doctor Leave Requests Management
        </h3>

        {doctors.flatMap(d => (d.leaveRequests || []).map(lr => ({ ...lr, doctor: d }))).length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">No leave requests submitted yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Requested Leave Date</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {doctors.flatMap(d => (d.leaveRequests || []).map(lr => ({ ...lr, doctor: d }))).map(item => (
                  <tr key={item._id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-white">Dr. {item.doctor?.user?.name || 'Doctor'}</td>
                    <td className="py-3 px-4 text-sky-400 font-semibold">{item.doctor?.department}</td>
                    <td className="py-3 px-4 text-white font-medium">{item.date}</td>
                    <td className="py-3 px-4 text-slate-400">{item.reason}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        item.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        item.status === 'rejected' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {item.status === 'pending' ? (
                        <>
                          <button
                            onClick={async () => {
                              try {
                                await api.put(`/doctors/${item.doctor._id}/leave-request/${item._id}`, { status: 'approved' });
                                setMessage({ type: 'success', text: `Leave approved for Dr. ${item.doctor.user?.name}` });
                                fetchData();
                              } catch (err) {
                                setMessage({ type: 'error', text: 'Failed to approve leave request' });
                              }
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await api.put(`/doctors/${item.doctor._id}/leave-request/${item._id}`, { status: 'rejected' });
                                setMessage({ type: 'success', text: `Leave rejected for Dr. ${item.doctor.user?.name}` });
                                fetchData();
                              } catch (err) {
                                setMessage({ type: 'error', text: 'Failed to reject leave request' });
                              }
                            }}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-slate-500 text-[11px] font-semibold">Decided</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* Modal: Onboard Doctor */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Onboard New Doctor</h3>
            <form onSubmit={handleCreateDoctor} className="space-y-3">
              <input
                type="text" required placeholder="Doctor Name (e.g. Dr. Jane Smith)"
                value={docForm.name} onChange={e => setDocForm({...docForm, name: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm"
              />
              <input
                type="email" required placeholder="Doctor Email"
                value={docForm.email} onChange={e => setDocForm({...docForm, email: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm"
              />
              <input
                type="password" required placeholder="Account Password"
                value={docForm.password} onChange={e => setDocForm({...docForm, password: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm"
              />
              <select
                value={docForm.department} onChange={e => setDocForm({...docForm, department: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm"
              >
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <input
                type="text" placeholder="Specialization"
                value={docForm.specialization} onChange={e => setDocForm({...docForm, specialization: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowDoctorModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white">Create Doctor Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Receptionist */}
      {showRecepModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Create Receptionist Account</h3>
            <form onSubmit={handleCreateRecep} className="space-y-3">
              <input
                type="text" required placeholder="Receptionist Full Name"
                value={recepForm.name} onChange={e => setRecepForm({...recepForm, name: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm"
              />
              <input
                type="email" required placeholder="Receptionist Email"
                value={recepForm.email} onChange={e => setRecepForm({...recepForm, email: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm"
              />
              <input
                type="password" required placeholder="Account Password"
                value={recepForm.password} onChange={e => setRecepForm({...recepForm, password: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowRecepModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white">Create Staff Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
