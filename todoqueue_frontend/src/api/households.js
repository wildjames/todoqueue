import axios from './axiosConfig';


export const fetchHouseholds = async () => {
  console.log("Getting household list");
  // Only do this if we are logged in
  if (localStorage.getItem('access_token') === null) {
    console.log("No access token.");
    return [];
  }
  console.log("We are logged in - getting household list");

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


export const createHousehold = async (name) => {
  try {
    // Get the logged in user
    const res = await axios.post(
      "/api/create_household/",
      {
        name: name
      },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true
      }
    );

    if (res.status !== 201) {
      console.log("Failed to create household.");
      return { error: res.data.name };
    }
    return { success: "Successfully created household." };

  } catch (error) {
    console.error("Failed to create household:", error);
    return { error: "Failed to create household." };
  }
};


export const deleteHousehold = async (id) => {
  try {
    await axios.delete(
      `/api/households/${id}/`,
      {
        withCredentials: true
      }
    );
    return { success: "Successfully deleted household." };

  } catch (error) {
    console.error("Failed to delete household:", error);
    return { error: "Failed to delete household." };
  }
};


export const addUserToHousehold = async (householdId, userEmail) => {
  try {
    let response = await axios.post(
      `/api/households/${householdId}/add_user/`,
      {
        email: userEmail
      },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true
      }
    );
    console.log(response);
    return { success: "Successfully added user to household." };
  }
  catch (error) {
    console.log("Failed to add user to household");
    console.log(error);
    return { error: `Failed to add user to household. ${error.response.data.detail}` };
  }
};


export const removeUserFromHousehold = async (householdId, userEmail) => {
  try {
    let response = await axios.post(
      `/api/households/${householdId}/remove_user/`,
      {
        email: userEmail
      },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true
      }
    );
    console.log(response);
    return { success: "Successfully removed user from household." };
  }
  catch (error) {
    console.log("Failed to remove user from household");
    console.log(error);
    return { error: `Failed to remove user from household. ${error.response.data.detail}` };
  }
}