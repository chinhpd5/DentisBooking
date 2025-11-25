import { Button, Col, Flex, Form, Input, Row, Select, Space } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Toast from "react-hot-toast";
import { CreateUser } from "../../types/user";
import { convertNameRoleArray } from "../../utils/helper";
import { USER_STATUS } from "../../contants";
import { addUser } from "../../services/user";
import { ArrowLeftOutlined } from "@ant-design/icons";
const { Option } = Select;
const dataRole = convertNameRoleArray();

function UserAdd() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateUser) => addUser(data),
    onSuccess: () => {
      Toast.success("Thêm tài khoản thành công");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      form.resetFields();
      navigate("/user");
    },
    // onError: (err: unknown) => {
    //   const error = err as { response?: { data?: { message?: string } } };
    //   Toast.error("Thêm tài khoản thất bại: " + error.response?.data?.message);
    // },
  });

  const onFinish = (values: CreateUser) => {
    mutate(values);
  };

  const onReset = () => {
    form.resetFields();
  };

  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Thêm mới tài khoản người dùng</h2>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/user")}>
          Quay lại
        </Button>
      </Flex>

      <Flex justify="center">
        <div style={{ width: "100%", maxWidth: 1200, padding: "0 16px" }}>
          <Form form={form} onFinish={onFinish} layout="vertical">
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Họ và tên"
                  rules={[{ required: true, message: "Vui lòng nhập tên" }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="role"
                  label="Vai trò"
                  rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
                >
                  <Select placeholder="Chọn vai trò">
                    {dataRole.map((r) => (
                      <Option value={r.value} key={r.value}>
                        {r.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="status"
                  label="Trạng thái"
                  initialValue={USER_STATUS.ACTIVE}
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Chọn trạng thái">
                    <Option value={USER_STATUS.ACTIVE}>Hoạt động</Option>
                    <Option value={USER_STATUS.DISABLED}>Vô hiệu hóa</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
              <Form.Item
                  name="username"
                  label="Tên đăng nhập"
                  rules={[
                    { required: true, message: "Vui lòng nhập username" },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[
                    { required: true, message: "Vui lòng nhập mật khẩu" },
                  ]}
                >
                  <Input.Password />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label="Xác nhận mật khẩu"
                  dependencies={["password"]}
                  hasFeedback
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng xác nhận mật khẩu",
                    },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("password") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Mật khẩu xác nhận không khớp")
                        );
                      },
                    }),
                  ]}
                >
                  <Input.Password />
                </Form.Item>
              </Col>
            </Row>

            <Row justify="start">
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={isPending}>
                    Thêm mới
                  </Button>
                  <Button onClick={onReset}>Nhập lại</Button>
                </Space>
              </Form.Item>
            </Row>
          </Form>
        </div>
      </Flex>
    </div>
  );
}

export default UserAdd;
