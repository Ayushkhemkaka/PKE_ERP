import { NextResponse } from 'next/server';

const isHttpsRequest = (request) => {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto.split(',')[0].trim().toLowerCase() === 'https';
  }
  return request.nextUrl.protocol === 'https:';
};

export function middleware(request) {
  if (process.env.NODE_ENV === 'production' && process.env.ENFORCE_HTTPS === 'true' && !isHttpsRequest(request)) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'
  ]
};

