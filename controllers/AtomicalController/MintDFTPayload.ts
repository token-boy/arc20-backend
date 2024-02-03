import Input, { Field } from 'helpers/input'

class MintDFTPayload extends Input {
  @Field({ type: 'string', required: true, maxLength: 64 })
  name!: string

  @Field({ type: 'string', required: true, maxLength: 64 })
  address!: string

  @Field({ type: 'number', required: true, min: 0, max: 500 })
  satsbyte!: number
}

export default MintDFTPayload
