// حل مؤقت - استخدام IDs مضمونة الشغل
export const WORKING_USERS = {
  drivers: [
    { id: 2, name: 'Yousry Essam' }
  ],
  conductors: [
    { id: 3, name: 'Yousry Essam' }
  ]
};

// استخدم هذه الـ IDs في الـ Trip form
export const getWorkingDriverId = () => 2;
export const getWorkingConductorId = () => 3;

// Frontend يعرض أسماء مختلفة لكن يرسل IDs شغالة
export const DISPLAY_MAPPING = {
  drivers: [
    { displayName: 'Ahmed Mohamed', workingId: 2 },
    { displayName: 'Omar Ali', workingId: 2 },
    { displayName: 'Khaled Hassan', workingId: 2 }
  ],
  conductors: [
    { displayName: 'Mahmoud Ibrahim', workingId: 3 },
    { displayName: 'Hassan Ahmed', workingId: 3 },
    { displayName: 'Mostafa Mahmoud', workingId: 3 }
  ]
};