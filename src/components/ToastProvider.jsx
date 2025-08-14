import { Toaster } from 'react-hot-toast';

const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        className: '',
        duration: 3000,
        style: {
          background: '#F9F5F1',
          color: '#6A5C58',
          width: '280px',
          minHeight: '60px',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          lineHeight: '1.4',
          fontSize: '1.05rem', 
        },
        success: {
          duration: 3000,
          style: {
            background: '#D1E8D0',
            color: '#6F916B',
            width: '280px',
            minHeight: '60px',
            padding: '12px 16px',
          },
          iconTheme: {
            primary: '#6F916B',
            secondary: '#D1E8D0',
          },
        },
        error: {
          duration: 4000,
          style: {
            background: '#FADFE6',
            color: '#A86F80',
            width: '280px',
            minHeight: '60px',
            padding: '12px 16px',
          },
          iconTheme: {
            primary: '#A86F80',
            secondary: '#FADFE6',
          },
        },
        custom: {
          duration: 3000,
          style: {
            background: '#FADFE6',
            color: '#A86F80',
            width: '280px',
            minHeight: '60px',
            padding: '12px 16px',
          },
          iconTheme: {
            primary: '#A86F80',
            secondary: '#FADFE6',
          },
        },
        info: {
          duration: 3000,
          style: {
            background: '#E0F2F7',
            color: '#6A8B9B',
            width: '280px',
          },
          iconTheme: {
            primary: '#6A8B9B',
            secondary: '#E0F2F7',
          },
        },
      }}
    />
  );
};

export default ToastProvider;