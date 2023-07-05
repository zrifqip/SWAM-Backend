require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const helmet = require('helmet');
const http = require('http');
const debug = require('debug')('backend-project:server');
const { Server } = require('socket.io');

const httpHelper = require('./helpers/http');
const AppErr = require('./helpers/AppError');
const ErrHandller = require('./helpers/ErrorHandlers');

const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');

const indexRouter = require('./routes/index');
const clientRouter = require('./routes/client');
const companyRouter = require('./routes/company');
const wsHandler = require('./routes/handlers/websocket');
const initView = require('./helpers/InitView');

const port = httpHelper.normalizePort(process.env.PORT || '3000');

const app = express();

mongoose
  .connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    authSource: 'admin',
  })
  .then(() => console.log('Database Connection Successful!'));

/// 1) GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(logger('dev'));
}
// Limit requests from same API
// const limiter = rateLimit({
//   max: 100,
//   windowMs: 60 * 60 * 1000,
//   message: 'Too many requests from this IP, please try again in an hour!',
// });
// app.use('/', limiter);
// Body parser, reading data from body into req.body
app.use(express.json());
// app.use(express.json({ limit: "10kb" }));
// Data sanitization against NoSQL query injection
app.use(mongoSanitize());
// Data sanitization against XSS
app.use(xss());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(compression());

app.use('/', indexRouter);
app.use('/users/client', clientRouter);
app.use('/company', companyRouter);

app.all('*', (req, res, next) => {
  next(new AppErr(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(ErrHandller);
app.set('port', port);

let server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});
//chat
wsHandler(io);
initView(mongoose.connection);

server.listen(port);
server.on('error', httpHelper.onError);
server.on('listening', () => {
  var addr = server.address();
  var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  debug('Listening on ' + bind);
});

module.exports = app;
