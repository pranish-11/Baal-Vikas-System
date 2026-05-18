import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import School from './models/School.js';
import User from './models/User.js';
import Student from './models/Student.js';
import Message from './models/Message.js';
import Complaint from './models/Complaint.js';
import LeaderboardEntry from './models/LeaderboardEntry.js';
import DetectionEvent from './models/DetectionEvent.js';

function barFor(bp) {
  if (bp >= 70) return 'var(--primary)';
  if (bp >= 45) return 'var(--sky)';
  return 'var(--coral)';
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  await Promise.all([
    DetectionEvent.deleteMany({}),
    LeaderboardEntry.deleteMany({}),
    Message.deleteMany({}),
    Complaint.deleteMany({}),
    Student.deleteMany({}),
    User.deleteMany({}),
    School.deleteMany({}),
  ]);

  const sunrise = await School.create({
    name: 'Sunrise Montessori',
    location: 'Kathmandu, Nepal',
    principalName: 'Dr. Priya Sharma',
    contactEmail: 'hello@sunrisemontessori.edu',
    phone: '+977-1-5550100',
    address: '12 Garden Road, Kathmandu',
    numberOfRooms: 4,
    notes: '82 students · 8 teachers',
    status: 'active',
  });

  const greenValley = await School.create({
    name: 'Green Valley Academy',
    location: 'Lalitpur, Nepal',
    principalName: 'Mr. Raj Thapa',
    contactEmail: 'info@greenvalley.edu',
    phone: '+977-1-5550200',
    address: '45 Valley View, Lalitpur',
    numberOfRooms: 6,
    notes: '134 students · 12 teachers',
    status: 'active',
  });

  const hashed = await bcrypt.hash('password123', 10);

  await User.create({
    name: 'Axion Admin',
    email: 'admin@axionschool.edu',
    password: hashed,
    role: 'admin',
    avatarInitials: 'AA',
    schoolId: sunrise._id,
  });

  const teacher = await User.create({
    name: 'Ms. Anika Roy',
    email: 'anika.roy@axionschool.edu',
    password: hashed,
    role: 'teacher',
    avatarInitials: 'AR',
    schoolId: sunrise._id,
  });

  const classroom = 'Room 3 — Sunflower Class';

  const studentSpecs = [
    { firstName: 'Liam', lastName: 'Anderson', age: 6, points: 52, behaviorPercent: 94, rank: 1 },
    { firstName: 'Emma', lastName: 'Martinez', age: 6, points: 38, behaviorPercent: 80, rank: 2 },
    { firstName: 'Sofia', lastName: 'Okonkwo', age: 7, points: 31, behaviorPercent: 68, rank: 3 },
    { firstName: 'Noah', lastName: 'Kim', age: 6, points: 28, behaviorPercent: 60, rank: 4 },
    { firstName: 'Olivia', lastName: 'Lee', age: 6, points: 24, behaviorPercent: 52, rank: 5 },
    { firstName: 'Jack', lastName: 'Ahmed', age: 7, points: 19, behaviorPercent: 35, rank: 6 },
    { firstName: 'Mia', lastName: 'Ibrahim', age: 6, points: 15, behaviorPercent: 30, rank: 7 },
    { firstName: 'Ethan', lastName: 'Torres', age: 7, points: 12, behaviorPercent: 24, rank: 8 },
  ];

  const students = [];
  for (const s of studentSpecs) {
    const initials = `${s.firstName[0]}${s.lastName[0]}`.toUpperCase();
    const bp = s.behaviorPercent;
    students.push(
      await Student.create({
        firstName: s.firstName,
        lastName: s.lastName,
        initials,
        age: s.age,
        classroom,
        schoolId: sunrise._id,
        enrollmentDate: new Date('2024-09-01'),
        medicalNotes: '',
        behaviorPercent: bp,
        points: s.points,
        rank: s.rank,
        avatarBg: '#E8F5F1',
        avatarColor: '#2E7D6B',
        barColor: barFor(bp),
      })
    );
  }

  const noah = students.find((s) => s.firstName === 'Noah' && s.lastName === 'Kim');

  const parent = await User.create({
    name: 'Mrs. Lena Kim',
    email: 'lena.kim@parent.edu',
    password: hashed,
    role: 'parent',
    avatarInitials: 'LK',
    schoolId: sunrise._id,
    childId: noah._id,
  });

  noah.parentId = parent._id;
  await noah.save();

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  await LeaderboardEntry.create([
    {
      studentId: students[0]._id,
      points: 5,
      source: 'Teacher Award',
      reason: 'Helping peers during work cycle',
      notifyParent: false,
      date: now,
    },
    {
      studentId: students[1]._id,
      points: 3,
      source: 'AI Detection',
      reason: 'Focused concentration',
      notifyParent: true,
      date: now,
    },
    {
      studentId: students[3]._id,
      points: 2,
      source: 'Peer Nomination',
      reason: 'Kindness on the playground',
      notifyParent: true,
      date: now,
    },
  ]);

  const detectionSamples = [
    {
      studentId: students[0]._id,
      type: 'positive',
      title: 'Grace & Courtesy observed',
      description: 'Liam held the door for classmates entering the classroom.',
      confidence: 0.92,
      pointsAwarded: 3,
      autoApproved: true,
      timestamp: new Date(now.getTime() - 15 * 60 * 1000),
    },
    {
      studentId: students[1]._id,
      type: 'positive',
      title: 'Deep work period',
      description: 'Emma sustained focus on math materials for 45 minutes.',
      confidence: 0.88,
      pointsAwarded: 2,
      autoApproved: true,
      timestamp: new Date(now.getTime() - 40 * 60 * 1000),
    },
    {
      studentId: students[3]._id,
      type: 'info',
      title: 'Movement break suggested',
      description: 'Noah requested a short walk after long seated work.',
      confidence: 0.71,
      pointsAwarded: 0,
      autoApproved: false,
      timestamp: new Date(now.getTime() - 55 * 60 * 1000),
    },
    {
      studentId: students[5]._id,
      type: 'warning',
      title: 'Volume in classroom',
      description: 'Jack spoke loudly during silent reading; gentle reminder given.',
      confidence: 0.84,
      pointsAwarded: 0,
      autoApproved: false,
      timestamp: new Date(now.getTime() - 90 * 60 * 1000),
    },
    {
      studentId: students[2]._id,
      type: 'positive',
      title: 'Peer collaboration',
      description: 'Sofia guided a younger student with pouring work.',
      confidence: 0.9,
      pointsAwarded: 4,
      autoApproved: true,
      timestamp: new Date(now.getTime() - 120 * 60 * 1000),
    },
  ];

  await DetectionEvent.insertMany(detectionSamples);

  await Complaint.insertMany([
    {
      filedBy: teacher._id,
      filedByType: 'teacher',
      subject: 'Playground equipment concern',
      description: 'Loose bolt noticed on climbing frame; maintenance notified.',
      priority: 'high',
      status: 'open',
      studentId: students[5]._id,
      schoolId: sunrise._id,
      createdAt: new Date(now.getTime() - 2 * 3600000),
    },
    {
      filedBy: parent._id,
      filedByType: 'parent',
      subject: 'Allergies in snack policy',
      description: 'Request to reinforce nut-free snacks in Sunflower class.',
      priority: 'medium',
      status: 'pending',
      studentId: noah._id,
      schoolId: sunrise._id,
      createdAt: new Date(now.getTime() - 26 * 3600000),
    },
    {
      filedBy: teacher._id,
      filedByType: 'teacher',
      subject: 'Pickup time change',
      description: 'Parent requested early pickup on Fridays; documenting for office.',
      priority: 'low',
      status: 'open',
      studentId: students[1]._id,
      schoolId: sunrise._id,
      createdAt: new Date(now.getTime() - 50 * 3600000),
    },
    {
      filedBy: parent._id,
      filedByType: 'parent',
      subject: 'Communication preference',
      description: 'Prefer messages via app for weekly updates.',
      priority: 'low',
      status: 'resolved',
      studentId: noah._id,
      schoolId: sunrise._id,
      createdAt: new Date(now.getTime() - 72 * 3600000),
    },
  ]);

  await Message.insertMany([
    {
      senderId: teacher._id,
      receiverId: parent._id,
      text: 'Hello Mrs. Kim, Noah had a wonderful morning with the sensorial materials.',
      timestamp: new Date(now.getTime() - 3 * 3600000),
      read: true,
    },
    {
      senderId: parent._id,
      receiverId: teacher._id,
      text: 'Thank you for the update! We will practice grace and courtesy at home too.',
      timestamp: new Date(now.getTime() - 2.5 * 3600000),
      read: true,
    },
    {
      senderId: teacher._id,
      receiverId: parent._id,
      text: 'Reminder: community walk tomorrow—please send a water bottle.',
      timestamp: new Date(now.getTime() - 1 * 3600000),
      read: false,
    },
    {
      senderId: teacher._id,
      receiverId: parent._id,
      text: 'Noah earned two kindness points at recess today.',
      timestamp: new Date(now.getTime() - 30 * 60000),
      read: false,
    },
  ]);

  console.log('Seed complete.');
  console.log('Schools:', sunrise.name, greenValley.name);
  console.log('Login: admin@axionschool.edu / password123');
  console.log('Login: anika.roy@axionschool.edu / password123');
  console.log('Login: lena.kim@parent.edu / password123');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
