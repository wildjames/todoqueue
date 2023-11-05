import axios from './axiosConfig';
import { backend_url } from './backend_url';

export const fetchHouseholds = async () => {
  console.log("Getting household list");
  // Only do this if we are logged in
  if (localStorage.getItem('access_token') === null) {
    console.log("No access token.");
    return [];
  }
  console.log("We are logged in - getting household list");

  const list_households_url = backend_url + "/api/households/";
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
      backend_url + "/api/create_household/",
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
      `${backend_url}/api/households/${id}/`,
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


export const removeUserFromHousehold = async (householdId, userEmail) => {
  try {
    let response = await axios.post(
      `${backend_url}/api/households/${householdId}/remove_user/`,
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

// Function to send an invitation to a user to join a household
export const inviteUserToHousehold = async (householdId, userEmail) => {
  try {
    const response = await axios.post(
      `${backend_url}/api/households/${householdId}/invite_user/`,
      { email: userEmail },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true
      }
    );
    console.log(response);
    if (response.status === 200) {
      return { success: "Invitation sent successfully." };
    }
    return { error: response };
  } catch (error) {
    console.error("Failed to send invitation:", error);
    return { error: `Failed to send invitation. ${error.response?.data?.detail || error.message}` };
  }
};

// Function to fetch pending invitations for the logged-in user
export const fetchPendingInvitations = async () => {
  try {
    const response = await axios.get(
      `${backend_url}/api/invitations/pending/`,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true
      }
    );
    console.log(response);
    if (response.status === 200) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch pending invitations:", error);
    return [];
  }
};

// Function to accept an invitation
export const acceptInvitation = async (invitationId) => {
  try {
    const response = await axios.post(
      `${backend_url}/api/invitations/${invitationId}/respond/`,
      { action: 'accept' },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true
      }
    );
    console.log(response);
    return { success: "Invitation accepted successfully." };
  } catch (error) {
    console.error("Failed to accept invitation:", error);
    return { error: `Failed to accept invitation. ${error.response?.data?.detail || error.message}` };
  }
};

// Function to decline an invitation
export const declineInvitation = async (invitationId) => {
  try {
    const response = await axios.post(
      `${backend_url}/api/invitations/${invitationId}/respond/`,
      { action: 'decline' },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true
      }
    );
    console.log(response);
    return { success: "Invitation declined successfully." };
  } catch (error) {
    console.error("Failed to decline invitation:", error);
    return { error: `Failed to decline invitation. ${error.response?.data?.detail || error.message}` };
  }
};
