import { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [patient, setPatient] = useState(() => {
    const saved = localStorage.getItem('myclinic_patient');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('myclinic_admin') === 'true';
  });
  const [selectedClinic, setSelectedClinic] = useState(null);

  const loginPatient = (patientData) => {
    setPatient(patientData);
    localStorage.setItem('myclinic_patient', JSON.stringify(patientData));
  };

  const logoutPatient = () => {
    setPatient(null);
    localStorage.removeItem('myclinic_patient');
    setSelectedClinic(null);
  };

  const loginAdmin = () => {
    setIsAdmin(true);
    localStorage.setItem('myclinic_admin', 'true');
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    localStorage.removeItem('myclinic_admin');
  };

  return (
    <AppContext.Provider
      value={{
        patient,
        loginPatient,
        logoutPatient,
        isAdmin,
        loginAdmin,
        logoutAdmin,
        selectedClinic,
        setSelectedClinic,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
