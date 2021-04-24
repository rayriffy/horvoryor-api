import axios from 'axios'
import { VercelRequest, VercelResponse } from '@vercel/node'

interface APIResult {
  response: {
    date: string
    endpoint: string
    prizes: {
      id: string,
      name: string,
      reward: string
      amount: number
      number: string[]
    }[]
    runningNumbers: {
      id: string,
      name: string,
      reward: string
      amount: number
      number: string[]
    }[]
  }
}

const api = async (req: VercelRequest, res: VercelResponse) => {
  if ((req.method ?? '').toLowerCase() === 'post') {
    // get data
    const lotteryNumber = req.body.lotteryNumber as string

    // get lottery info
    const json = await axios.get<APIResult>('https://lotto.api.rayriffy.com/latest')

    let isWin = []

    const promise1 = json.data.response.prizes.map(prize => {
      if (prize.number.includes(lotteryNumber)) {
        isWin.push('win')

        return res.status(200).json({
          status: 'success',
          data: {
            lotteryNumber,
            lotteryResult: prize.id,
            lotteryReward: prize.reward,
            lotterDateCycle: json.data.response.date,
          },
        })
      }
    })
  
    // Check for running numbers
    const promise2 = json.data.response.runningNumbers.map(runningNumber => {
      return runningNumber.number.map(number => {
        if (
          (runningNumber.id === 'runningNumberFrontThree' &&
            lotteryNumber.slice(0, 3) === number) ||
          (runningNumber.id === 'runningNumberBackThree' &&
            lotteryNumber.slice(3, 6) === number) ||
          (runningNumber.id === 'runningNumberBackTwo' &&
            lotteryNumber.slice(4, 6) === number)
        ) {
          isWin.push('win')

          return res.status(200).json({
            status: 'success',
            data: {
              lotteryNumber,
              lotteryResult: runningNumber.id,
              lotteryReward: runningNumber.reward,
              lotterDateCycle: json.data.response.date,
            },
          })
        }
      })
    })
  
    await Promise.all([promise1, promise2])

    if (isWin.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          lotteryNumber,
          lotteryResult: 'none',
          lotteryReward: '0',
          lotterDateCycle: json.data.response.date,
        },
      })
    }
  } else {
    return res.status(405).json({
      status: 'failure',
      data: {
        message: 'invalid request method'
      },
    })
  }
}

export default api