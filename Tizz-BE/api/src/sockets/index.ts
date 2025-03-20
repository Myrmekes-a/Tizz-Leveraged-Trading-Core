import { Server, Socket } from 'socket.io';

import { logger } from '../utils/logger';
import { connectRedis } from './redis';

const socketio = async (server: any) => {
  try {
    // Socket communication
    const io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    io.close(() => {
      console.log('Server and all connected sockets closed');
    });

    // io.use((socket, next) => {
    //   const token = (socket.handshake.query.token as string).split('"')[1];
    //   if (!token) {
    //     return next(new Error('Authentication error: Token missing'));
    //   }

    //   jwt.verify(token, JWT_SECRET, (err, decoded) => {
    //     if (err) {
    //       return next(new Error('Authentication error: Invalid token'));
    //     }
    //     // Attach user information to the socket
    //     (socket as any).user = decoded;

    //     next();
    //   });
    // });

    io.on('connection', async (socket: Socket) => {
      const id = (socket as any).user?.user?.id;
      ``;
      console.log(`socket (${socket.id}) -> ${id}`);
      // const user = await UserModel.findById(id)
      // if (user?.mnemonic!) {
      //   const { eth_wallet_address, tron_wallet_address } = getAccountDetails(user?.mnemonic!)
      //   await SocketModel.findOneAndUpdate({ userId: id, evm: eth_wallet_address, tron: tron_wallet_address }, { userId: id, socketId: socket.id, evm: eth_wallet_address, tron: tron_wallet_address }, { upsert: true })
      // } socket.on('init', async () => {
      //   const data = await MsgModel.find().sort({ time: -1 }).limit(10);
      //   let returnValue: any[] = []
      //   console.log("data length", data.length)
      //   for (let index = 0; index < data.length; index++) {
      //     const res = await UserModel.findById(data[index].userId)
      //     returnValue.push({ ...data[index].toObject(), avatar: res!.avatar, username: res!.username })
      //   }
      //   console.log(returnValue)
      //   io.emit('broadcast', returnValue.reverse())
      // });

      // socket.on('new_msg', async (msg: string) => {
      //   console.log(`socket new msg ${msg}`);
      //   // io.emit('broadcast', returnValue.reverse())
      // });

      // socket.on('notify', async () => {
      //   // io.emit('notification', data)
      // });

      // socket.on('notifyall', async () => {
      //   // io.emit('notification', data)
      // });
    });

    await connectRedis(io);

    logger.info('  Socket server is running');
  } catch (err) {
    logger.error('  Socket server run failed');
    console.error(err);
  }
};

export default socketio;
