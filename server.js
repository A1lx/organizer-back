const http = require('http');
const Koa = require('koa');
const WS = require('ws');
const { koaBody } = require('koa-body');
const Router = require('koa-router');
const app = new Koa();

//обработка запросов, шаблонная копи-паст часть
app.use(koaBody({
  urlencoded: true,
}));

app.use(async (ctx, next) => {
  const origin = ctx.request.get('Origin');
  if (!origin) {
    return await next();
  }

  const headers = { 'Access-Control-Allow-Origin': '*', };

  if (ctx.request.method !== 'OPTIONS') {
    ctx.response.set({ ...headers });
    try {
      return await next();
    } catch (e) {
      e.headers = { ...e.headers, ...headers };
      throw e;
    }
  }

  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
    });

    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Request-Headers'));
    }

    ctx.response.status = 204;
  }
});

// write code here
const router = new Router();

let messages = [
  {
    id: 1,
    text: 'Первым в мире программистом была женщина — англичанка Ада Лавлэйс. В середине 19 века она составила план операций для прообраза современной ЭВМ — аналитической машины Чарльза Беббиджа, с помощью которых можно было решить уравнение Бернулли, выражающее закон сохранения энергии движущейся жидкости. Ада скончалась в возрасте 37 лет, не дождавшись построения машины Беббиджа.'
  }, 
  {
    id: 2,
    text: `Случайные факты:
    Слово «школа» происходит от греческого scole – досуг, праздность, отдых.
    Алмаз не растворяется в кислоте. Единственное, что может его разрушить - очень большая температура.
    Самая сильная мышца в человеческом организме - язык.
    У человека меньше мyскyлов, чем y гyсеницы.
    Ни мужчина, ни женщина не может чихнуть с открытыми глазами. Около 2% автомобильных аварий, происходящих в мире, вызвано чиханием за рулем.
    `
  },
  {
    id: 3,
    text: `Полезная ссылка: https://developer.mozilla.org`
  },
  {
    id: 4,
    text: `Код, который должен светиться: console.log('Hello');`
  }
];

app.use(router.routes()).use(router.allowedMethods());
const port = process.env.PORT || 7070;
const server = http.createServer(app.callback());

const wsServer = new WS.Server({
  server
});

wsServer.on('connection', (ws) => {
  ws.on('message', (newMessage) => {
    const data = JSON.parse(newMessage);
    messages.push( {text: data} );

    Array.from(wsServer.clients)
    .filter(client => client.readyState === WS.OPEN)
    .forEach(client => client.send(JSON.stringify(messages)));
  });

  ws.send(JSON.stringify(messages));
});

server.listen(port);