import Input, { Field } from 'helpers/input'
import { UINT8_MAX } from 'helpers/constants'

class MintFTPayload extends Input {
  @Field({ type: 'string', required: true, maxLength: 64 })
  name!: string

  @Field({ type: 'string', required: true, maxLength: 512 })
  description!: string

  @Field({ type: 'string', required: true, maxLength: 2048 })
  legalTerms!: string

  @Field({ type: 'number', required: true, min: 0, max: UINT8_MAX })
  totalSupply!: number

  @Field({ type: 'string', required: true, maxLength: 64 })
  address!: string

  @Field({ type: 'number', required: true, min: 0, max: 500 })
  satsbyte!: number
}

export default MintFTPayload
