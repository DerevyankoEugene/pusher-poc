let app = {
  currentUser: null,
};

async function initPusher(userId) {
  const { TokenProvider, ChatManager } = Chatkit;
  const chatManager = new ChatManager({
    instanceLocator: "v1:us1:ab481df6-cfe9-4318-86ed-1a36e46183a7",
    userId,
    tokenProvider: new TokenProvider({ url: "/pusher/auth" }),
  });
  await chatManager
    .connect()
    .then((currentUser) => {
      app.currentUser = currentUser;
      const roomsText = currentUser.rooms
        .map((r) => JSON.stringify({ id: r.id, unread: r.unreadCount }))
        .join("<br/>");
      document.getElementById(
        "current-user-info",
      ).innerHTML = `CurrentUser: ${app.currentUser.name} ${app.currentUser.id}, <br/>rooms:<br/>${roomsText}`;
      console.log("Successful connection", currentUser);
    })
    .catch((err) => {
      console.log("Error on connection", err);
    });
}

async function initMessaging() {
  function addToHistory(message) {
    const historyElm = document.getElementById("history");
    const own = message.senderId === app.currentUser.id;
    historyElm.innerHTML =
      historyElm.innerHTML +
      `<p class="message ${own ? "outgoing" : "incoming"}">${own ? "" : message.senderId + ": "}${
        message.parts[0].payload.content
      }</p>`;
  }

  document.getElementById("connect-room-button").addEventListener("click", async () => {
    // on send
    document.getElementById("send-message-button").addEventListener("click", async () => {
      const roomId = document.getElementById("send-to-room-id").value;
      const message = document.getElementById("message-to-send").value;
      await app.currentUser.sendSimpleMessage({
        text: message,
        roomId,
      });
    });
    // on receive
    await app.currentUser.subscribeToRoomMultipart({
      roomId: document.getElementById("send-to-room-id").value,
      hooks: {
        onMessage: (message) => {
          addToHistory(message);
        },
      },
    });
  });
}

function initCreateUser() {
  document.getElementById("create-user-button").addEventListener("click", async () => {
    const userId = encodeURIComponent(document.getElementById("new-user-id").value);
    const userName = encodeURIComponent(document.getElementById("new-user-name").value);
    const url = `/pusher/user/create?user_id=${userId}&user_name=${userName}`;
    result = await fetch(url, { method: "POST" });
    console.log(result);
  });
}

function initCreateRoom() {
  document.getElementById("create-room-button").addEventListener("click", async () => {
    const creatorId = encodeURIComponent(document.getElementById("new-room-creator_id").value);
    const userIds = document
      .getElementById("new-room-users")
      .value.split(",")
      .map((id) => encodeURIComponent(id.trim()));
    const url = `/pusher/room/create?creator_id=${creatorId}&user_ids=${userIds}`;
    result = await fetch(url, { method: "POST" });
    alert(result);
  });
}

function initConnectUser() {
  document.getElementById("connect-button").addEventListener("click", async () => {
    const userId = document.getElementById("connect-user-id").value;
    await initPusher(userId);
    await initMessaging();
  });
}

async function loadUsers() {
  const result = await fetch("/pusher/user/list");
  const users = await result.json();
  const text = users.map((u) => `<p>${u.name} (${u.id})</p>`).join("\n");
  document.getElementById("user-list").innerHTML = text;
}

document.addEventListener("DOMContentLoaded", async () => {
  initCreateUser();
  initConnectUser();
  initCreateRoom();
  loadUsers();
});
