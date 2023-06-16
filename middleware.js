import { withMiddlewareAuthRequired } from "@auth0/nextjs-auth0/edge";

export default withMiddlewareAuthRequired();

//set the route we want to add this middleware to.
export const config = {
  matcher: ["/api/chat/:path*", "/chat/:path*"], //will match all chat routes.
};
