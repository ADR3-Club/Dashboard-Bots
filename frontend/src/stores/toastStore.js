import { create } from 'zustand';

let toastId = 0;

const useToastStore = create((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = toastId++;
    const newToast = {
      id,
      type: toast.type || 'info', // 'success', 'error', 'warning', 'info'
      title: toast.title,
      message: toast.message,
      duration: toast.duration || 5000,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast]
    }));

    // Auto remove after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id)
        }));
      }, newToast.duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  }
}));

export default useToastStore;
