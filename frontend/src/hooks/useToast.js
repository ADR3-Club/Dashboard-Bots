import useToastStore from '../stores/toastStore';

export default function useToast() {
  const { addToast } = useToastStore();

  return {
    success: (message, title = null) => {
      addToast({ type: 'success', message, title });
    },
    error: (message, title = null) => {
      addToast({ type: 'error', message, title });
    },
    warning: (message, title = null) => {
      addToast({ type: 'warning', message, title });
    },
    info: (message, title = null) => {
      addToast({ type: 'info', message, title });
    },
    custom: (options) => {
      addToast(options);
    },
  };
}
