import { NextRequest, NextResponse } from 'next/server'

function genState() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export async function GET(req: NextRequest) {
  const appId = process.env.ZHIHU_APP_ID
  const redirectUri = process.env.ZHIHU_REDIRECT_URI

  if (!appId || !redirectUri) {
    return NextResponse.json(
      { error: 'Zhihu OAuth not configured' },
      { status: 500 }
    )
  }

  const state = genState()

  const params = new URLSearchParams({
    redirect_uri: redirectUri,
    app_id: appId,
    response_type: 'code',
    state,
  })

  const authUrl = `https://openapi.zhihu.com/authorize?${params.toString()}`

  // state 存 cookie，callback 时验证
  const response = NextResponse.redirect(authUrl)
  response.cookies.set('zhihu_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 分钟
    path: '/',
  })

  return response
}
