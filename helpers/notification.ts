const channels = [
  'https://open.feishu.cn/open-apis/bot/v2/hook/27653359-e446-4528-9b6a-290eaaf19580',
]

export function sendNotification(title: string, content: string, channel = 0) {
  const payload = {
    msg_type: 'interactive',
    card: {
      config: {
        wide_screen_mode: true,
      },
      elements: [
        {
          tag: 'markdown',
          content: `**${title}**<hr />${content}<hr />${new Date().toISOString()}`,
        },
      ],
    },
  }

  try {
    fetch(channels[channel], {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error(error)
  }
}
