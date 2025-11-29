import { Form, Input, Button, Typography, Card } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useMutation } from "@tanstack/react-query";
import { changePassword } from '../services/user';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import bgImage from '../assets/bg.jpg';

const { Title } = Typography;

function ChangePassword() {
  const [form] = Form.useForm();
  const navigate = useNavigate();


  const mutation = useMutation({
    mutationFn: (data: { oldPassword: string; newPassword: string; username: string }) => changePassword(data),
    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công");
      form.resetFields();
      // Có thể redirect về trang chủ hoặc logout để user đăng nhập lại
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    },
  });

  const handleChangePassword = (values: { oldPassword: string; newPassword: string; confirmPassword: string; username: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      toast.error("Mật khẩu mới và xác nhận mật khẩu không khớp");
      return;
    }
    mutation.mutate({
      oldPassword: values.oldPassword,
      newPassword: values.newPassword,
      username: values.username,
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay}></div>
      <Card style={styles.card}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
          Đổi mật khẩu
        </Title>

        <Form
          form={form}
          name="changePasswordForm"
          onFinish={handleChangePassword}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label="Tài khoản"
            name="username"
            rules={[
              { required: true, message: 'Vui lòng nhập tài khoản!' },
              { min: 3, message: 'Tài khoản ít nhất 3 ký tự' },
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Nhập tài khoản" 
              disabled={!!localStorage.getItem("usernameDentis")}
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu cũ"
            name="oldPassword"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu cũ!' },
              { min: 6, message: 'Mật khẩu cũ ít nhất 6 ký tự' },
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Nhập mật khẩu cũ" 
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
              { min: 6, message: 'Mật khẩu mới ít nhất 6 ký tự' },
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Nhập mật khẩu mới" 
            />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu mới và xác nhận mật khẩu không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Nhập lại mật khẩu mới" 
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={mutation.isPending}
            >
              Đổi mật khẩu
            </Button>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
            <Button 
              type="link" 
              onClick={() => navigate('/login')}
            >
              Quay lại trang đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(3px)',
  },
  card: {
    width: 500,
    padding: 24,
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    position: 'relative',
    zIndex: 1,
  },
};

export default ChangePassword;

