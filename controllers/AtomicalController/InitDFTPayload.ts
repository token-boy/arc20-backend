import Input, { Field } from 'helpers/input'
import { UINT8_MAX, UINT_MAX } from 'helpers/constants'

class InitDFTPayload extends Input {
  @Field({ type: 'string', required: true, maxLength: 64 })
  name!: string

  @Field({ type: 'number', required: true, min: 1, max: UINT_MAX })
  mintAmount!: number

  @Field({ type: 'number', required: true, min: 1, max: UINT_MAX })
  maxMints!: number

  @Field({ type: 'number', required: true, min: 0, max: UINT_MAX })
  mintHeight!: number

  @Field({ type: 'string', required: true, maxLength: 512 })
  description!: string

  @Field({ type: 'string', required: true, maxLength: 2048 })
  legalTerms!: string

  @Field({ type: 'string', required: true, maxLength: 64 })
  bitworkc!: string

  @Field({ type: 'number', required: true, min: 0, max: UINT8_MAX })
  totalSupply!: number

  @Field({ type: 'string', required: true, maxLength: 64 })
  address!: string

  @Field({ type: 'number', required: true, min: 0, max: 500 })
  satsbyte!: number
}

export default InitDFTPayload
