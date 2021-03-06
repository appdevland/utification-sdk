import localFetch from "./utils/localFetch";

export default class ClientSDK {
  /**
   *
   * @param {string} projectID the ID of the project you are using (check your utification dashboard for more info)
   * @param {object} devoptions options for SDK development DO NOT USE IF YOU ARE NOT DEVELOPING THE SDK
   * @param {string} devoptions.apiOrigin the origin of the API you are using
   * @param {string} devoptions.publicVAPIDKey the vapid key for the server
   */
  constructor(projectID, devoptions) {
    if (!projectID) {
      throw new Error("projectID is required");
    }

    if (devoptions) {
      this.apiOrigin = devoptions.apiOrigin
        ? devoptions.apiOrigin
        : "https://utification.appdevland.tech";
      this.publicVAPIDKey = devoptions.publicVAPIDKey
        ? devoptions.publicVAPIDKey
        : "BGNtEcQWz8Dnt8DUWAkfSacCO1f2PE6TUOUzoNuw_2WF_TPi16G8urTAegQiI9YuUiYVa7-Anjh_weGb-OiDN4w";
    } else {
      this.apiOrigin = "https://utification.appdevland.tech";
      this.publicVAPIDKey =
        "BGNtEcQWz8Dnt8DUWAkfSacCO1f2PE6TUOUzoNuw_2WF_TPi16G8urTAegQiI9YuUiYVa7-Anjh_weGb-OiDN4w";
    }
    this.projectID = projectID;
  }

  /**
   * subscribe a user and add him to the database
   * @param {ServiceWorkerRegistration} registration the service worker registration you want to subscribe
   * @param {object} filters the data you want to add to this subscription
   */
  async subscribe(registration, filters) {
    let sub;
    try {
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(this.publicVAPIDKey),
      });
    } catch (err) {
      console.error(`Error occured when adding a subscription to the client`);
      console.error(err);
      return;
    }

    let res = await localFetch(this.apiOrigin, "/api/subscribe", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: {
        subscription: sub,
        projectID: this.projectID,
        filters: filters,
      },
    });
    if (res.status !== 200 && res.status !== 201) {
      console.error("error occured when adding subscription to server");
      console.error(res);
      return;
    }
    return sub;
  }

  /**
   * updates a subscription
   * @param {PushSubscription} sub subscription you want to update
   * @param {object} filters the data you want to change
   */
  async updateSubscription(sub, filters) {
    let res = await localFetch(this.apiOrigin, "/api/subscribe", {
      method: "PUT",
      headers: {
        "Content-type": "application/json",
      },
      body: {
        subscription: sub,
        projectID: this.projectID,
        filters: filters,
      },
    });

    if (res.status !== 200 && res.status !== 201) {
      console.error(`Error when updating subscription on the server`);
      console.error(res);
      return;
    }

    return sub;
  }

  /**
   * delete a subscription from the server
   * @param {PushSubscription} sub the subscription you want to delete
   */
  async unsubscribe(sub) {
    let res = await localFetch(this.apiOrigin, "/api/subscribe", {
      method: "DELETE",
      body: {
        subscription: sub,
        projectID: this.projectID,
      },
      headers: {
        "Content-type": "application/json",
      },
    });

    if (res.status !== 200 && res.status !== 201) {
      console.error(
        "error occured while deleting subscription on the server wump wump wump"
      );
      console.error(res);
      return;
    }

    await sub.unsubscribe();
    return sub;
  }
}

const base64ToUint8Array = (base64) => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(b64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};
