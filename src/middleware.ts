import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/indents/:path*", "/approvals/:path*", "/procurement/:path*", "/grn/:path*", "/inventory/:path*", "/admin/:path*"],
};
