import {
  Button,
  Col,
  Flex,
  Form,
  Input,
  Row,
  Select,
  Space,
  Spin,
} from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Toast from "react-hot-toast";
import { getUserById, updateUser } from "../../services/user";
import IUser,{ CreateUser } from "../../types/user";
import { getListStaff } from "../../services/staff";
import { convertNameRoleArray } from "../../utils/helper";
import { USER_STATUS } from "../../contants";

const { Option } = Select;
const dataRole = convertNameRoleArray();

function UserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<IUser>({
    queryKey: ["user", id],
    queryFn: () => getUserById(id!),
    enabled: !!id,
  });

  const { data: staffList } = useQuery({
    queryKey: ["staffs", 1, 100],
    queryFn: () => getListStaff(1, 100, undefined, undefined, undefined),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateUser> }) =>
      updateUser(id, data),
    onSuccess: () => {
      Toast.success("Cập nhật người dùng thành công");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      navigate("/user");
    },
    onError: (error: any) => {
      Toast.error("Cập nhật thất bại: " + error?.data?.message);
    },
  });

  const onFinish = (values: Partial<CreateUser>) => {
    if (id) {
      mutate({ id, data: values });
    }
  };

  if (isLoading) return <Spin />;

  return (
    <div>
      <h2>Cập nhật người dùng</h2>
      <Flex justify="center">
        <div style={{ minWidth: 1000 }}>
          <Form form={form} onFinish={onFinish} initialValues={user}>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Họ tên"
                  rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="username"
                  label="Tên đăng nhập"
                  rules={[
                    { required: true, message: "Vui lòng nhập tên đăng nhập" },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="role"
                  label="Vai trò"
                  rules={[{ required: true, message: "Chọn vai trò" }]}
                >
                  <Select placeholder="Chọn vai trò">
                    {dataRole.map((role) => (
                      <Option key={role.value} value={role.value}>
                        {role.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="status"
                  label="Trạng thái"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Chọn trạng thái">
                    <Option value={USER_STATUS.ACTIVE}>Đang hoạt động</Option>
                    <Option value={USER_STATUS.DISABLED}>Vô hiệu hóa</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name={["staffId", "_id"]}
                  label="Nhân viên liên kết"
                  rules={[{ required: true, message: "Chọn nhân viên" }]}
                >
                  <Select placeholder="Chọn nhân viên">
                    {staffList?.data?.map((staff: any) => (
                      <Option key={staff._id} value={staff._id}>
                        {staff.name} - {staff.phone}
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
                    Cập nhật
                  </Button>
                  <Button htmlType="button" onClick={() => form.resetFields()}>
                    Reset
                  </Button>
                </Space>
              </Form.Item>
            </Row>
          </Form>
        </div>
      </Flex>
    </div>
  );
}

export default UserEdit;
