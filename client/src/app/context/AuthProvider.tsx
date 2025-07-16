'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type UserType = 'student' | 'club' | null

interface AuthContextType {
  user: any
  userType: UserType
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userType: null,
  loading: true,
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null)
  const [userType, setUserType] = useState<UserType>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:5000/api/auth/me', {
      credentials: 'include',
    })
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated')
        return res.json()
      })
      .then(data => {
        setUser(data.user)
        setUserType(data.type)
        setLoading(false)
      })
      .catch(() => {
        setUser(null)
        setUserType(null)
        setLoading(false)
      })
  }, [])

  return (
    <AuthContext.Provider value={{ user, userType, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
export default AuthProvider