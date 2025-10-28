import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            setAuth: (user, token) => {
                set({ user, token, isAuthenticated: true });
                localStorage.setItem('auth_token', token);
            },

            clearAuth: () => {
                set({ user: null, token: null, isAuthenticated: false });
                localStorage.removeItem('auth_token');
            },

            updateUser: (user) => {
                set({ user });
            },

            isAdmin: () => {
                const { user } = get();
                return user?.role === 'admin';
            },

            getToken: () => {
                return get().token || localStorage.getItem('auth_token');
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);