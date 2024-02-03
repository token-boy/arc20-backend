import { verifyMessage } from '@unisat/wallet-utils'
import { cache } from 'database'
import { Http400 } from 'helpers/http'

import Input, { Field } from 'helpers/input'
import { Controller, Payload, Post } from 'helpers/route'

class SignInPayload extends Input {
  @Field({ type: 'string', required: true })
  address: string

  @Field({ type: 'string', required: true })
  pubkey: string

  @Field({ type: 'string', required: true })
  signature: string
}

@Controller('/sessions')
class SessionController {
  @Post('')
  @Payload(SignInPayload)
  async signIn(payload: SignInPayload, ctx: Ctx) {
    const sessionId = ctx.get('X-Session-Id')
    const result = verifyMessage(payload.pubkey, sessionId, payload.signature)
    if (!result) {
      throw new Http400(400, 'Invalid signature')
    }
    cache.set(`session:${sessionId}`, payload.address)

    return {}
  }
}

export default SessionController
