const Koa = require("koa");
const Router = require("koa-router");
const serve = require("koa-static");
const koaBody = require("koa-bodyparser");

const Chatkit = require("@pusher/chatkit-server");

const chatkit = new Chatkit.default({
  instanceLocator: "v1:us1:ab481df6-cfe9-4318-86ed-1a36e46183a7",
  key: "18dbfc0c-3eca-4768-acfc-a10abba0c3cd:vHGnSTrn5Zi7WenxF0sSyoGI7Kn4eg1yMg8Da78aR8E=",
});

const appPort = 8765;

const app = new Koa();
const router = new Router();

const serveWeb = serve("./web", {});
router.get(`/client/(.*)`, async (ctx, next) => {
  await serveWeb(ctx, next);
});

router.post("/pusher/auth", (ctx) => {
  const authData = chatkit.authenticate({
    userId: ctx.request.query.user_id,
  });
  ctx.status = 200;
  ctx.body = authData.body;
});

router.post("/pusher/user/create", async (ctx) => {
  console.log(ctx.request.query);
  await chatkit
    .createUser({
      id: decodeURIComponent(ctx.request.query.user_id),
      name: decodeURIComponent(ctx.request.query.user_name),
    })
    .then(() => {
      ctx.body = "User created successfully";
      ctx.status = 200;
    })
    .catch((err) => {
      ctx.body = err;
      ctx.status = 500;
    });
});

router.get("/pusher/user/list", async (ctx) => {
  await chatkit
    .getUsers()
    .then((res) => {
      ctx.body = res;
      ctx.status = 200;
    })
    .catch((err) => {
      ctx.body = err;
      ctx.status = 500;
    });
});

router.post("/pusher/room/create", async (ctx) => {
  console.log(ctx.request.query);
  const hash = new Date().getTime();
  const roomId = decodeURIComponent(`custom id ${hash}`);
  await chatkit.createRoom({
    id: roomId,
    creatorId: decodeURIComponent(ctx.request.query.creator_id),
    name: `custom name ${ctx.request.query.creator_id} ${hash}`,
    customData: { foo: 42 },
  });
  await chatkit.addUsersToRoom({
    roomId: roomId,
    userIds: ctx.request.query.user_ids.split(",").map((id) => decodeURIComponent(id)),
  });
  const room = await chatkit.getRoom({ roomId });
  ctx.body = room;
  ctx.status = 200;
});

app.use(koaBody());
app.use(router.allowedMethods());
app.use(router.routes());
app.listen(appPort);

global.console.log(`started on ${appPort}`);
