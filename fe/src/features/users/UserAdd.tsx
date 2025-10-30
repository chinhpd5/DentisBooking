import { Button, Col, Flex, Form, Input, Row, Select, Space, Spin } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Toast from "react-hot-toast";
import { CreateUser } from "../../types/user";
import { convertNameRole, convertNameRoleArray } from "../../utils/helper";
import { STAFF_STATUS, USER_STATUS } from "../../contants";
import { addUser } from "../../services/user";
import { getListStaff } from "../../services/staff";
import { IStaff } from "../../types/staff";

const { Option } = Select;
const dataRole = convertNameRoleArray();

function UserAdd() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: staffList, isLoading: loadingStaff } = useQuery({
    queryKey: ["staffs", 1, 100],
    queryFn: () => getListStaff(1, 100, "", "", STAFF_STATUS.ACTIVE),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateUser) => addUser(data),
    onSuccess: () => {
      Toast.success("Thêm tài khoản thành công");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      form.resetFields();
      navigate("/user");
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      Toast.error("Thêm tài khoản thất bại: " + error.response?.data?.message);
    },
  });

  const onFinish = (values: CreateUser) => {
    mutate(values);
  };

  const onReset = () => {
    form.resetFields();
  };

  if (loadingStaff) return <Spin />;


  return (
    <div>
      <h2>Thêm mới tài khoản người dùng</h2>

      <Flex justify="center">
        <div style={{ minWidth: 1000 }}>
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

              <Col span={12}>
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

                <Form.Item
                  name="staffId"
                  label="Nhân viên liên kết"
                  rules={[{ required: true, message: "Chọn nhân viên" }]}
                >
                  <Select placeholder="Chọn nhân viên">
                    {staffList?.data.map((s: IStaff) => (
                      <Option key={s._id} value={s._id}>
                        {s.name} - {s.phone} - {convertNameRole(s.role)}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row justify="end">
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={isPending}>
                    Thêm mới
                  </Button>
                  <Button onClick={onReset}>Reset</Button>
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
