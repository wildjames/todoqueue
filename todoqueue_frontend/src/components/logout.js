import { React, useEffect } from "react";

import useAuthCheck from '../hooks/authCheck';
import { logOutUser } from '../api/users';


export const Logout = ({ setShowHouseholdSelector }) => {

  useAuthCheck();

  useEffect(() => {
    setShowHouseholdSelector(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    logOutUser();
  }, []);

  return <div></div>;
};
