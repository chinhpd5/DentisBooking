import { Button, Col, Flex, Form, Input, Row, Select, Space, Spin, Card } from "antd";
const { Option } = Select;
import {convertNameRoleArray} from "../../utils/helper";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import Toast from "react-hot-toast";
import { STAFF_STATUS } from "../../contants";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getStaffById, updateStaff } from "../../services/staff";
import { CreateStaff, IStaff } from "../../types/staff";
import { useEffect } from "react";
import ScheduleInput from "../../components/ScheduleInput";

const tailLayout = {
  wrapperCol: { offset: 8, span: 16 },
};

const dataRole = convertNameRoleArray();

function StaffEdit() {
  const { id } = useParams(); // Lấy id từ URL
  const [form] = Form.useForm();
  const navigate = useNavigate()

  const { data, isLoading } = useQuery<IStaff>({
    queryKey: ["staff", id],
    queryFn: () => getStaffById(id!),
    enabled: !!id
  });
  console.log(data);
  

  useEffect(() => {
    if (data) {
      form.setFieldsValue(data);
    }
  }, [data, form]);

  const queryClient = useQueryClient();
  
  const {mutate, isPending} = useMutation({
    mutationFn:  ({id,data}: {id: string, data: CreateStaff}) => updateStaff(id!,data),
    onSuccess: () => {
      Toast.success("Cập nhật nhân viên thành công");
      queryClient.invalidateQueries({queryKey: ["staffs"]});
      form.resetFields();
      navigate('/staff')
    },
    // onError: (error: unknown) => {
    //   const err = error as { data?: { message?: string } };
    //   Toast.error("Cập nhật nhân viên thất bại: " + (err.data?.message || "Lỗi không xác định"));
    // }
  });

  const onFinish = (data: CreateStaff) => {
    if(id)
      mutate({id,data});
  };

  const onReset = () => {
    form.resetFields();
  };

  if(isLoading){
    return <Spin></Spin>
  }

 
  return (
    <div>
      <h2>Cập nhật nhân viên</h2>

      <Flex justify="center">
        <div style={{ width: "100%", maxWidth: 1200, padding: "0 16px" }}>
          <Form
            form={form}
            name="control-hooks"
            onFinish={onFinish}
            
          >
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item layout="vertical" name="name" label="Họ và tên:" rules={[
                  { 
                    required: true,
                    message: "Họ và tên là bắt buộc"
                  }
                  ]}>
                  <Input />
                </Form.Item>

                <Form.Item layout="vertical" name="phone" label="Số điện thoại:" rules={[
                  {
                    required: true,
                    message: "Số điện thoại là bắt buộc",
                  },
                  {
                    pattern: /^0\d{9}$/,
                    message: "Số điện thoại không hợp lệ",
                  },
                ]}>
                  <Input />
                </Form.Item>
                <Form.Item
                  layout="vertical" 
                  name="status"
                  label="Trạng thái:"
                >
                  <Select
                    placeholder="Chọn trạng thái"
                    // onChange={}
                    allowClear
                  >
                     <Option value={STAFF_STATUS.ACTIVE}>Đang làm</Option>
                     <Option value={STAFF_STATUS.DISABLED}>Đã nghỉ</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  layout="vertical" 
                  name="role"
                  label="Vai trò:"
                  rules={[{ required: true, message: "Nhập vai trò cho tài khoản" }]}
                >
                  <Select
                    placeholder="Chọn vai trò"
                    // onChange={}
                    allowClear
                  >
                    {
                      dataRole.map(item => {
                        return <Option value={item.value}>{item.name}</Option>
                      })
                    }
                  </Select>
                </Form.Item>
                <Form.Item layout="vertical" name="email" label="Email:" rules={[
                  {
                    required: false,
                    },
                  {
                    type: "email",
                    message: "Email không đúng định dạng",
                  },
                ]}>
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            {/* Section for Work Schedule */}
            <Row gutter={24}>
              <Col span={24}>
                <Card title="Lịch làm việc" style={{ marginTop: 16 }}>
                  <ScheduleInput formName="scheduleMonday" label="Thứ 2" />
                  <ScheduleInput formName="scheduleTuesday" label="Thứ 3" />
                  <ScheduleInput formName="scheduleWednesday" label="Thứ 4" />
                  <ScheduleInput formName="scheduleThursday" label="Thứ 5" />
                  <ScheduleInput formName="scheduleFriday" label="Thứ 6" />
                  <ScheduleInput formName="scheduleSaturday" label="Thứ 7" />
                  <ScheduleInput formName="scheduleSunday" label="Chủ Nhật" />
                </Card>
              </Col>
            </Row>

            <Row justify="start" gutter={24} style={{ marginTop: 24 }}>
              <Form.Item {...tailLayout}>
                <Space>
                  <Button type="primary" htmlType="submit" loading={isPending}>
                    Cập nhật
                  </Button>
                  <Button htmlType="button" onClick={onReset}>
                    Nhập lại
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

export default StaffEdit;
