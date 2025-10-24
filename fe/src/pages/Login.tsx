import { Form, Input, Button, Typography, Card } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useMutation } from "@tanstack/react-query"
import { login } from '../services/user';
import { Login } from '../types/user';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
const { Title } = Typography;

function Login() {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (data: Login) => login(data),
    onSuccess: (res: any) => {
      toast.success("Đăng nhập thành công");
      localStorage.setItem('tokenDentis',res.data.data.accessToken)
      navigate('/')
    },
    onError: (res: any) => {
      toast.error("Đăng nhập thất bại: " +res.data.message)
    }
  })


  const handleLogin = (values: any) => {
    mutation.mutate(values)
  };
  return (
    <div style={styles.container}>
      <Card style={styles.card}>
        <Title level={2} style={{ textAlign: 'center' }}>Đăng nhập</Title>

        <Form
          form={form}
          name="loginForm"
          onFinish={handleLogin}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label="Tên đăng nhập"
            name="username"
            rules={[
              { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
              { min: 3, message: 'Tên đăng nhập ít nhất 3 ký tự' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nhập tên đăng nhập" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 6, message: 'Mật khẩu ít nhất 6 ký tự' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#f0f2f5',
  },
  card: {
    width: 550,
    padding: 24,
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
};

export default Login