import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code') || searchParams.get('authorization_code')
  const state = searchParams.get('state')

  if (!code) {
    return NextResponse.redirect('https://lkslife.site/scene/tunnel?error=zhihu_auth_failed')
  }

  // 验证 state 防 CSRF
  const cookieState = req.cookies.get('zhihu_state')?.value
  if (!state || state !== cookieState) {
    return NextResponse.redirect('https://lkslife.site/scene/tunnel?error=zhihu_state_mismatch')
  }

  const appId = process.env.ZHIHU_APP_ID
  const appKey = process.env.ZHIHU_APP_KEY
  const redirectUri = process.env.ZHIHU_REDIRECT_URI

  if (!appId || !appKey || !redirectUri) {
    return NextResponse.redirect('/scene/tunnel?error=zhihu_not_configured')
  }

  try {
    // 1. 用 code 换 access_token（x-www-form-urlencoded）
    const tokenParams = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    })

    const tokenRes = await fetch('https://openapi.zhihu.com/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    })

    const tokenData = await tokenRes.json()

    // 知乎错误响应也是 HTTP 200，通过 code 字段判断
    if (tokenData.code && tokenData.code !== 200) {
      console.error('Zhihu token error:', tokenData)
      return NextResponse.redirect('/scene/tunnel?error=zhihu_token_failed')
    }

    const accessToken = tokenData.access_token
    if (!accessToken) {
      return NextResponse.redirect('/scene/tunnel?error=zhihu_no_token')
    }

    // 2. 获取用户信息（Authorization: Bearer）
    const userRes = await fetch('https://openapi.zhihu.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    const userInfo = await userRes.json()

    // 知乎错误响应
    if (userInfo.code && userInfo.code !== 200) {
      console.error('Zhihu user error:', userInfo)
    }

    // 3. 设置 cookie 并重定向回隧道页面
    const userCookie = JSON.stringify({
      uid: userInfo.uid,
      name: userInfo.fullname,
      avatar: userInfo.avatar_path,
      headline: userInfo.headline,
      accessToken,
    })

    const response = NextResponse.redirect('https://lkslife.site/scene/tunnel')
    response.cookies.set('zhihu_user', userCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    // 允许知乎授权页面在 iframe 中加载 callback
    response.headers.set('X-Frame-Options', 'ALLOWALL')
    response.headers.set('Content-Security-Policy', "frame-ancestors 'self' https://openapi.zhihu.com")

    return response
  } catch (err) {
    console.error('Zhihu OAuth error:', err)
    return NextResponse.redirect('https://lkslife.site/scene/tunnel?error=zhihu_auth_failed')
  }
}
