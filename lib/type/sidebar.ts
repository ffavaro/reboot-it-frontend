export interface NavItem {
  title: string
  url: string
  allowedRoles?: string[]
}

export interface NavSection {
  title: string
  url: string
  allowedRoles?: string[]
  items: NavItem[]
}