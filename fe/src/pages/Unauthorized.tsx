import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

function Unauthorization()  {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <Result
        status="403"
        title="403"
        subTitle="Bạn không có quyền truy cập vào trang này."
        extra={
          <Button type="primary" onClick={() => navigate('/login')}>
            Quay lại Đăng nhập
          </Button>
        }
      />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
};

export default Unauthorization;
