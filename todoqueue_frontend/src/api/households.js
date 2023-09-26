import axios from './axiosConfig';


export const fetchHouseholds = async () => {
    // Only do this if we are logged in
    if (localStorage.getItem('access_token') === null) {
      return [];
    }
  
    const list_households_url = "/api/households/";
    try {
      const res = await axios.get(list_households_url, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (res.status !== 200) {
        console.log("Failed to fetch households.");
        return [];
      }
      return res.data;
    } catch (error) {
      console.error("An error occurred while fetching households:", error);
      return [];
    }
  };