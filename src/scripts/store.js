import { atom } from 'nanostores';

export const userSession = atom({
  isLoggedIn: false,
  role: null, // 'patient' | 'doctor'
  username: '',
  appointments: [
    { id: 'APT-104', date: '2026-07-28', time: '09:00 AM', scanType: '3T MRI Brain', status: 'Confirmed' }
  ],
  notifications: [
    { id: 1, text: 'Your 3T Brain MRI scan results are ready for medical referral review.', read: false }
  ],
  savedCases: ['Case: BRAIN_3T_082']
});

export const activeClinicalStats = atom({
  activeScans: 4,
  throughputPerHour: 12.8,
  radiologistLoad: 'Optimal',
  systemStatus: 'Fully Operational'
});

export function triggerPatientLogin(username) {
  userSession.set({
    isLoggedIn: true,
    role: 'patient',
    username: username || 'Tebogo Mokgosi',
    appointments: [
      { id: 'APT-104', date: '2026-07-28', time: '09:00 AM', scanType: '3T MRI Brain', status: 'Confirmed' },
      { id: 'APT-211', date: '2026-08-15', time: '11:15 AM', scanType: 'Ultra-HD Ultrasound Abdomen', status: 'Pending Triage' }
    ],
    notifications: [
      { id: 1, text: 'Welcome to your secure medical profile. Please complete your clinical questionnaire.', read: false }
    ],
    savedCases: []
  });
}

export function triggerDoctorLogin(username) {
  userSession.set({
    isLoggedIn: true,
    role: 'doctor',
    username: username || 'Dr. K. Lesedi, MD',
    appointments: [],
    notifications: [
      { id: 1, text: 'New MRI scan referred from Gaborone Private Hospital ready for review.', read: false },
      { id: 2, text: 'Urgent diagnostic peer review requested for Case ID: CT_CHEST_440.', read: false }
    ],
    savedCases: ['Case: BRAIN_3T_082', 'Case: CT_CHEST_440']
  });
}

export function logout() {
  userSession.set({
    isLoggedIn: false,
    role: null,
    username: '',
    appointments: [],
    notifications: [],
    savedCases: []
  });
}
