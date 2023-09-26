import { useEffect } from "react";

import useAuthCheck from '../hooks/authCheck';
import { logOutUser } from '../api/users';


export const Logout = ({ setShowHouseholdSelector }) => {

  useAuthCheck();

  useEffect(() => {
    setShowHouseholdSelector(false);
  }, []);


  useEffect(() => {
    logOutUser();
  }, []);

  return <div></div>;
};
