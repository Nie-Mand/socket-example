import express from 'express'
import { createServer } from 'http'
import { Server as IO } from 'socket.io'
import { createClient } from 'redis'

const main = async () => {
  try {
    const redis = createClient({
      url: 'redis://localhost:17494',
    })
    await redis.connect()

    const app = express()
    const server = createServer(app)

    const io = new IO(server, {
      cors: {
        origin: '*',
      },
    })

    io.on('connection', socket => {
      socket.on('SEND_MESSAGE', async ({ message, friend }) => {
        const to = await redis.get(friend)
        if (to) {
          io.to(to).emit('RECIEVE_MESSAGE', message)
        }
      })

      socket.on('TYPING', async ({ friend }) => {
        console.log('got it', friend)

        const to = await redis.get(friend)
        console.log(to)
        if (to) {
          io.to(to).emit('HE_IS_TYPING')
        }
      })

      socket.on('BLUR', async ({ friend }) => {
        const to = await redis.get(friend)
        if (to) {
          io.to(to).emit('HE_IS_NOT_TYPING')
        }
      })

      socket.on('LOGIN', username => {
        redis.set(username, socket.id)
        console.log(`${username} logged in`)
      })

      socket.on('disconnect', () => {
        console.log('bye ', socket.id)
      })
    })

    server.listen(9000, () => {
      console.log('Server is listening')
    })
  } catch (e) {
    console.error(e)
  }
}
main()
