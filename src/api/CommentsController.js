import Comments from '../model/Comments'
import Post from '../model/Post'
import User from '../model/User'
import { checkCode } from '@/common/Utils'
import { getJWTPayload } from '../common/Utils'
import CommentsHands from '../model/CommentsHands'

const canReply = async (ctx) => {
  let result = false
  const obj = await getJWTPayload(ctx.header.authorization)
  if (typeof obj._id === 'undefined') {
    return result
  } else {
    const user = await User.findByID(obj._id)
    if (user.status === '0') {
      result = true
    }
    return result
  }
}

class CommentsController {
  // 获取评论列表
  async getComments (ctx) {
    const params = ctx.query
    const tid = params.tid
    const page = params.page ? params.page : 0
    const limit = params.limit ? parseInt(params.limit) : 10
    let result = await Comments.getCommentsList(tid, page, limit)
    // 判断用户是否登录，已登录的用户才去判断点赞信息
    let obj = {}
    if (typeof ctx.header.authorization !== 'undefined') {
      obj = await getJWTPayload(ctx.header.authorization)
    }
    if (typeof obj._id !== 'undefined') {
      result = result.map(item => item.toJSON())
      for (let i = 0; i < result.length; i++) {
        let item = result[i]
        item.handed = '0'
        const commentsHands = await CommentsHands.findOne({ cid: item._id, uid: obj._id })
        if (commentsHands && commentsHands.cid) {
          if (commentsHands.uid === obj._id) {
            item.handed = '1'
          }
        }
      }
    }
    const total = await Comments.queryCount(tid)
    ctx.body = {
      code: 200,
      total,
      data: result,
      msg: 'Query succeeded'
    }
  }

  // 获取用户最近的评论记录
  async getCommentPublic (ctx) {
    const params = ctx.query
    const result = await Comments.getCommetsPublic(params.uid, params.page, parseInt(params.limit))
    if (result.length > 0) {
      ctx.body = {
        code: 200,
        data: result,
        msg: 'Query recent comment records succeed'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: 'Query comment records failed'
      }
    }
  }

  // 添加评论
  async addComment (ctx) {
    const check = await canReply(ctx)
    if (!check) {
      ctx.body = {
        code: 500,
        msg: 'User muted'
      }
      return
    }
    const { body } = ctx.request
    const sid = body.sid
    const code = body.code
    // 验证图片验证码的时效性、正确性
    const result = await checkCode(sid, code)
    if (!result) {
      ctx.body = {
        code: 500,
        msg: 'Wrong verification code'
      }
      return
    }
    const newComment = new Comments(body)
    const obj = await getJWTPayload(ctx.header.authorization)
    newComment.cuid = obj._id
    // 查询帖子的作者，以便发送消息
    const post = await Post.findOne({ _id: body.tid })
    newComment.uid = post.uid
    const comment = await newComment.save()
    const num = await Comments.getTotal(post.uid)
    global.ws.send(post.uid, JSON.stringify({
      event: 'message',
      message: num
    }))
    // 评论记数
    const updatePostresult = await Post.updateOne({ _id: body.tid }, { $inc: { answer: 1 } })
    if (comment._id && updatePostresult.ok === 1) {
      ctx.body = {
        code: 200,
        data: comment,
        msg: 'Comment succeeded'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: 'Comment failed'
      }
    }
  }

  async updateComment (ctx) {
    const check = await canReply(ctx)
    if (!check) {
      ctx.body = {
        code: 500,
        msg: 'User muted'
      }
      return
    }
    const { body } = ctx.request
    const result = await Comments.updateOne({ _id: body.cid }, { $set: body })
    ctx.body = {
      code: 200,
      msg: 'Modify succeed',
      data: result
    }
  }

  async setBest (ctx) {
    // 对用户权限的判断，post uid -> header id
    const obj = await getJWTPayload(ctx.header.authorization)
    if (typeof obj === 'undefined' && obj._id !== '') {
      ctx.body = {
        code: '401',
        msg: 'User not login or not authenticatd'
      }
      return
    }
    const params = ctx.query
    const post = await Post.findOne({ _id: params.tid })
    if (post.uid === obj._id && post.isEnd === '0') {
      // 说明这是作者本人，可以去设置isBest
      const result = await Post.updateOne({ _id: params.tid }, {
        $set: {
          isEnd: '1'
        }
      })
      const result1 = await Comments.updateOne({ _id: params.cid }, { $set: { isBest: '1' } })
      if (result.ok === 1 && result1.ok === 1) {
        // 把积分值给采纳的用户
        const comment = await Comments.findByCid(params.cid)
        const result2 = await User.updateOne({ _id: comment.cuid }, { $inc: { favs: parseInt(post.fav) } })
        if (result2.ok === 1) {
          ctx.body = {
            code: 200,
            msg: 'Set succeed',
            data: result2
          }
        } else {
          ctx.body = {
            code: 500,
            msg: 'Set best answer failed'
          }
        }
      } else {
        ctx.body = {
          code: 500,
          msg: 'Set failed',
          data: { ...result, ...result1 }
        }
      }
    } else {
      ctx.body = {
        code: 500,
        msg: 'Cannot set on end post'
      }
    }
  }

  async setHands (ctx) {
    const obj = await getJWTPayload(ctx.header.authorization)
    const params = ctx.query
    // 判断用户是否已经点赞
    const tmp = await CommentsHands.find({ cid: params.cid, uid: obj._id })
    if (tmp.length > 0) {
      ctx.body = {
        code: 500,
        msg: 'Please not repeat like'
      }
      return
    }
    // 新增一条点赞记录
    const newHands = new CommentsHands({
      cid: params.cid,
      uid: obj._id
    })
    const data = await newHands.save()
    // 更新comments表中对应的记录的hands信息 +1
    const result = await Comments.updateOne({ _id: params.cid }, { $inc: { hands: 1 } })
    if (result.ok === 1) {
      ctx.body = {
        code: 200,
        msg: 'Like succeed',
        data: data
      }
    } else {
      ctx.body = {
        code: 500,
        msg: 'Save like record failed'
      }
    }
  }
}

export default new CommentsController()
