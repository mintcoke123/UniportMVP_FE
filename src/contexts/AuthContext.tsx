
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, mockUsers, DEFAULT_ASSETS } from '../mocks/userData';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signup: (email: string, password: string, nickname: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUserAssets: (assets: Partial<Pick<User, 'totalAssets' | 'investmentAmount' | 'profitLoss' | 'profitLossRate'>>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const isLoggedIn = user !== null;

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    // 먼저 localStorage에서 가입한 사용자 확인
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const localUser = existingUsers.find((u: User) => u.email === email && u.password === password);
    
    if (localUser) {
      setUser(localUser);
      localStorage.setItem('currentUser', JSON.stringify(localUser));
      return { success: true, message: '로그인 성공!' };
    }
    
    // mock 사용자에서 확인
    const foundUser = mockUsers.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('currentUser', JSON.stringify(foundUser));
      return { success: true, message: '로그인 성공!' };
    }
    
    return { success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' };
  };

  const signup = async (email: string, password: string, nickname: string): Promise<{ success: boolean; message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // mock 사용자와 localStorage 사용자 모두에서 중복 확인
    const allUsers = [...mockUsers, ...existingUsers];
    
    const emailExists = allUsers.some((u: User) => u.email === email);
    if (emailExists) {
      return { success: false, message: '이미 존재하는 이메일입니다' };
    }

    const nicknameExists = allUsers.some((u: User) => u.nickname === nickname);
    if (nicknameExists) {
      return { success: false, message: '이미 존재하는 닉네임입니다' };
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      password,
      nickname,
      profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}`,
      ...DEFAULT_ASSETS
    };

    existingUsers.push(newUser);
    localStorage.setItem('users', JSON.stringify(existingUsers));

    const userToStore = { ...newUser };
    localStorage.setItem('currentUser', JSON.stringify(userToStore));
    setUser(userToStore);

    return { success: true, message: '회원가입이 완료되었습니다' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const updateUserAssets = (assets: Partial<Pick<User, 'totalAssets' | 'investmentAmount' | 'profitLoss' | 'profitLossRate'>>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...assets };
    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    // localStorage의 users 배열도 업데이트
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = existingUsers.findIndex((u: User) => u.id === user.id);
    if (userIndex !== -1) {
      existingUsers[userIndex] = updatedUser;
      localStorage.setItem('users', JSON.stringify(existingUsers));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, signup, logout, updateUserAssets }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
