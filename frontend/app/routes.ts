import { type RouteConfig, index, route, relative } from "@react-router/dev/routes"

const r = relative(new URL("./routes", import.meta.url).pathname)

export default [
  index("routes/home.tsx"),
  route("/sessions", "routes/sessions/index.tsx"),
  route("/sessions/:id", "routes/sessions/$id.tsx"),
  route("/login", "routes/login.tsx"),
  route("/signup", "routes/signup.tsx"),
  route("/dashboard", "routes/dashboard.tsx"),
  route("/profile", "routes/profile.tsx"),
  route("/creator", "routes/creator/index.tsx"),
  route("/creator/new", "routes/creator/new.tsx"),
] satisfies RouteConfig
