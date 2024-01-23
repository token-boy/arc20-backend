import { Test } from 'database'
import { Controller,Delete, Model } from 'helpers/route'

@Controller('/test')
class TestController {
  @Delete('/resources/:id')
  @Model(Test)
  async resources(test: Test) {
    await test.remove()
    return test
  }
}

export default TestController
