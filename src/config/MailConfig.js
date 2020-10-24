import nodemailer from 'nodemailer'
import config from '@/config'
import qs from 'qs'

// async..await is not allowed in global scope, must use a wrapper
async function send (sendInfo) {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  // let testAccount = await nodemailer.createTestAccount()

  // create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'imoocbrian@qq.com', // generated ethereal user
      pass: 'pmvwsfrmoanajaah' // generated ethereal password
    }
  })

  // let sendInfo = {
  //   code: '1234',
  //   expire: '2019-10-01',
  //   email: 'imoocbrian@qq.com',
  //   user: 'Brian',
  // }
  const baseUrl = config.baseUrl
  const route = sendInfo.type === 'email' ? '/confirm' : '/reset'
  const url = `${baseUrl}/#${route}?` + qs.stringify(sendInfo.data)

  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: '"Authenticate email" <imoocbrian@qq.com>', // sender address
    to: sendInfo.email, // list of receivers
    subject:
      sendInfo.user !== '' && sendInfo.type !== 'email'
        ? `Hi，${sendInfo.user}！ShareAspace community ${sendInfo.type === 'reset' ? 'reset password link！' : 'verification code！'}`
        : ' ShareAspace community confirm modify email link', // Subject line
    text: `Your invitation code in ShareAspace community is ${
      sendInfo.code
      },invitation code expiry on: ${sendInfo.expire}`, // plain text body
    html: `
        <div style="border: 1px solid #dcdcdc;color: #676767;width: 600px; margin: 0 auto; padding-bottom: 50px;position: relative;">
        <div style="height: 60px; background: #393d49; line-height: 60px; color: #58a36f; font-size: 18px;padding-left: 10px;">Welcome to ShareAspace community</div>
        <div style="padding: 25px">
          <div>Hi，${sendInfo.user}，the reset link will be expired in 30 minutes，please before ${
      sendInfo.expire
      } ${sendInfo.code ? 'reset your password' : 'modify your email as：' + sendInfo.data.username}：</div>
          <a href="${url}" style="padding: 10px 20px; color: #fff; background: #009e94; display: inline-block;margin: 15px 0;">${sendInfo.code ? 'Reset password' : 'Confirm set email'}</a>
          <div style="padding: 5px; background: #f2f2f2;">Not activate if this is not operated by yourself.</div>
        </div>
        <div style="background: #fafafa; color: #b4b4b4;text-align: center; line-height: 45px; height: 45px; position: absolute; left: 0; bottom: 0;width: 100%;">Please not reply system email directly</div>
    </div>
    ` // html body
  })

  return `Message sent: %s, ${info.messageId}`
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info))
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

// main().catch(console.error)

export default send
