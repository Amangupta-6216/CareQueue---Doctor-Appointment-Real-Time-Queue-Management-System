const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');
const QueueEntry = require('./models/QueueEntry');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doctor_queue';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('🧹 Clearing existing collections...');
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});
    await QueueEntry.deleteMany({});

    console.log('🔑 Hashing default passwords...');
    const defaultPassword = await bcrypt.hash('Password123', 10);
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const recepPassword = await bcrypt.hash('Recep@123', 10);

    // 1. Create Super Admin
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@hospital.com',
      password: adminPassword,
      role: 'admin',
      phone: '+1-800-555-0100'
    });
    console.log('✅ Admin Created: admin@hospital.com (Pass: Admin@123)');

    // 2. Create Receptionist
    const recepUser = await User.create({
      name: 'Sarah Receptionist',
      email: 'receptionist@hospital.com',
      password: recepPassword,
      role: 'receptionist',
      phone: '+1-800-555-0101'
    });
    console.log('✅ Receptionist Created: receptionist@hospital.com (Pass: Recep@123)');

    // 3. Create Sample Patient & Senior Citizen Patient
    const patientUser = await User.create({
      name: 'John Patient',
      email: 'patient@hospital.com',
      password: defaultPassword,
      role: 'patient',
      phone: '+1-555-0199',
      isSeniorCitizen: false
    });

    const seniorPatient = await User.create({
      name: 'Robert Senior',
      email: 'senior@hospital.com',
      password: defaultPassword,
      role: 'patient',
      phone: '+1-555-0188',
      isSeniorCitizen: true
    });
    console.log('✅ Patients Created: patient@hospital.com & senior@hospital.com (Pass: Password123)');

    // 4. Seed Doctors per Department
    const doctorList = [
      { name: 'Dr. Sharma', email: 'sharma@hospital.com', department: 'General Medicine', spec: 'Internal Medicine', fee: 500 },
      { name: 'Dr. Verma', email: 'verma@hospital.com', department: 'General Medicine', spec: 'Family Medicine', fee: 550 },
      { name: 'Dr. Mehta', email: 'mehta@hospital.com', department: 'Cardiology', spec: 'Interventional Cardiology', fee: 1000 },
      { name: 'Dr. Rao', email: 'rao@hospital.com', department: 'Cardiology', spec: 'Electrophysiology', fee: 1100 },
      { name: 'Dr. Iyer', email: 'iyer@hospital.com', department: 'Orthopedics', spec: 'Joint Replacement & Trauma', fee: 850 },
      { name: 'Dr. Nair', email: 'nair@hospital.com', department: 'Pediatrics', spec: 'Pediatric Care', fee: 600 },
      { name: 'Dr. Kapoor', email: 'kapoor@hospital.com', department: 'Dermatology', spec: 'Cosmetic & Clinical Derma', fee: 750 },
      { name: 'Dr. Bose', email: 'bose@hospital.com', department: 'ENT', spec: 'Ear Nose Throat Specialist', fee: 650 }
    ];

    const datesToSeed = [];
    const today = new Date();
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const d = new Date(today);
      d.setDate(d.getDate() + dayOffset);
      datesToSeed.push(d.toISOString().split('T')[0]);
    }


    for (const docData of doctorList) {
      const user = await User.create({
        name: docData.name,
        email: docData.email,
        password: defaultPassword,
        role: 'doctor',
        phone: '+1-555-0177'
      });

      const slots = [];
      for (const dStr of datesToSeed) {
        const startHours = [9, 10, 11, 14, 15, 16];
        for (const hour of startHours) {
          slots.push({
            date: dStr,
            startTime: `${hour.toString().padStart(2, '0')}:00`,
            endTime: `${hour.toString().padStart(2, '0')}:30`,
            isBooked: false
          });
          slots.push({
            date: dStr,
            startTime: `${hour.toString().padStart(2, '0')}:30`,
            endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
            isBooked: false
          });
        }
      }

      await Doctor.create({
        user: user._id,
        department: docData.department,
        specialization: docData.spec,
        qualification: 'MBBS, MD (Gold Medalist)',
        consultationFee: docData.fee,
        availableSlots: slots,
        onLeave: false
      });

      console.log(`👨‍⚕️ Seeded Doctor: ${docData.name} (${docData.department})`);
    }

    console.log('\n🎉 Database Seeded Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error);
    process.exit(1);
  }
};

seedData();
