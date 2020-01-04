var MyGame = (function () {
  'use strict';

  var global = window;

  const problems = [
      {
          "question": {
              "label": "风险可以从不同角度、根据不同的标准来进行分类。百年不遇的暴雨属于"
          },
          "answers": [
              {
                  "label": "不可预测风险",
                  "isCorrect": true
              },
              {
                  "label": "可预测风险",
                  "isCorrect": false
              },
              {
                  "label": "已知风险",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "（）指的是从项目的优势、劣势、机会和威胁出发，对项目进行考察，从而更全面地考虑风险"
          },
          "answers": [
              {
                  "label": "头脑风暴法",
                  "isCorrect": false
              },
              {
                  "label": "因果图",
                  "isCorrect": false
              },
              {
                  "label": "SWOT分析法",
                  "isCorrect": true
              }
          ]
      },
      {
          "question": {
              "label": "下面哪个不属于项目管理中的变量控制"
          },
          "answers": [
              {
                  "label": "时间",
                  "isCorrect": false
              },
              {
                  "label": "质量",
                  "isCorrect": false
              },
              {
                  "label": "沟通",
                  "isCorrect": true
              }
          ]
      },
      {
          "question": {
              "label": "项目管理计划不包括"
          },
          "answers": [
              {
                  "label": "绩效信息",
                  "isCorrect": true
              },
              {
                  "label": "项目目标",
                  "isCorrect": false
              },
              {
                  "label": "配置管理计划",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "商业智能系统应具有的主要功能不包括"
          },
          "answers": [
              {
                  "label": "数据仓库",
                  "isCorrect": false
              },
              {
                  "label": "分析能力",
                  "isCorrect": false
              },
              {
                  "label": "联机实务处理OLTP",
                  "isCorrect": true
              }
          ]
      },
      {
          "question": {
              "label": "在组织级项目管理中，要求项目组合、项目集、项目三者都要与（）保持一致。"
          },
          "answers": [
              {
                  "label": "组织管理",
                  "isCorrect": false
              },
              {
                  "label": "组织战略",
                  "isCorrect": true
              },
              {
                  "label": "组织文化",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "项目外包是承接项目可能采取的方式，但只有（）是允许的"
          },
          "answers": [
              {
                  "label": "部分外包",
                  "isCorrect": true
              },
              {
                  "label": "整体外包",
                  "isCorrect": false
              },
              {
                  "label": "层层转包",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "战略管理包含3个层次，（）不属于战略管理的层次。"
          },
          "answers": [
              {
                  "label": "目标层",
                  "isCorrect": false
              },
              {
                  "label": "规划层",
                  "isCorrect": true
              },
              {
                  "label": "方针层",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "项目组合的管理/协调对象是（）"
          },
          "answers": [
              {
                  "label": "项目团队",
                  "isCorrect": false
              },
              {
                  "label": "项目经理",
                  "isCorrect": false
              },
              {
                  "label": "组合管理人员",
                  "isCorrect": true
              }
          ]
      },
      {
          "question": {
              "label": "一份项目进度网络图中的关键路径有（）"
          },
          "answers": [
              {
                  "label": "只有1条",
                  "isCorrect": false
              },
              {
                  "label": "只有2条",
                  "isCorrect": false
              },
              {
                  "label": "1条或多条",
                  "isCorrect": true
              }
          ]
      },
      {
          "question": {
              "label": "智能制造是制造技术发展的必然趋势，从理论上来讲，（）是智能制造的核心"
          },
          "answers": [
              {
                  "label": "制造机器人",
                  "isCorrect": false
              },
              {
                  "label": "信息物理系统",
                  "isCorrect": true
              },
              {
                  "label": "互联网",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "（）不是获取需求的方法"
          },
          "answers": [
              {
                  "label": "问卷调查",
                  "isCorrect": false
              },
              {
                  "label": "会议讨论",
                  "isCorrect": false
              },
              {
                  "label": "决策分析",
                  "isCorrect": true
              }
          ]
      },
      {
          "question": {
              "label": "软件工程中，（）的目的是评价软件产品，以确定其对使用意图的适合性"
          },
          "answers": [
              {
                  "label": "审计",
                  "isCorrect": false
              },
              {
                  "label": "技术评审",
                  "isCorrect": true
              },
              {
                  "label": "功能确认",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "软件测试是为评价和改进产品质量进行的活动？"
          },
          "answers": [
              {
                  "label": "是",
                  "isCorrect": true
              },
              {
                  "label": "否",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "软件测试是必须在编码阶段完成后才开始的活动？"
          },
          "answers": [
              {
                  "label": "是",
                  "isCorrect": false
              },
              {
                  "label": "否",
                  "isCorrect": true
              }
          ]
      },
      {
          "question": {
              "label": "软件测试一般分为单元测试、集成测试、系统测试等阶段"
          },
          "answers": [
              {
                  "label": "是",
                  "isCorrect": true
              },
              {
                  "label": "否",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "在软件工程项目中，评估和改进一个过程是提高（）的一种手段"
          },
          "answers": [
              {
                  "label": "产品质量",
                  "isCorrect": true
              },
              {
                  "label": "使用质量",
                  "isCorrect": false
              },
              {
                  "label": "外部质量",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "信息系统的安全威胁分成七类，其中不包括（）"
          },
          "answers": [
              {
                  "label": "人为事件风险",
                  "isCorrect": false
              },
              {
                  "label": "项目管理风险",
                  "isCorrect": false
              },
              {
                  "label": "功能风险",
                  "isCorrect": true
              }
          ]
      },
      {
          "question": {
              "label": "局域网中，常采用广播消息的方法来获取访问目标IP地址对应的MAC地址，实现此功能的协议为（）"
          },
          "answers": [
              {
                  "label": "RARP协议",
                  "isCorrect": false
              },
              {
                  "label": "SMTP协议",
                  "isCorrect": false
              },
              {
                  "label": "ARP协议",
                  "isCorrect": true
              }
          ]
      },
      {
          "question": {
              "label": "“采用先进成熟的技术和设备，满足当前业务需求，兼顾未来的业务需求”体现了“（）”"
          },
          "answers": [
              {
                  "label": "实用性和先进性",
                  "isCorrect": true
              },
              {
                  "label": "灵活性和可扩展性",
                  "isCorrect": false
              },
              {
                  "label": "可管理性",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "在无线通信领域，现在主流应用的是第四代（4G）通信技术，其理论下载速率可达到（）Mbps"
          },
          "answers": [
              {
                  "label": "4",
                  "isCorrect": false
              },
              {
                  "label": "20",
                  "isCorrect": false
              },
              {
                  "label": "100",
                  "isCorrect": true
              }
          ]
      },
      {
          "question": {
              "label": "根据《中华人民共和国政府采购法》，（）应作为政府采购的主要方式"
          },
          "answers": [
              {
                  "label": "公开招标",
                  "isCorrect": true
              },
              {
                  "label": "竞争性谈判",
                  "isCorrect": false
              },
              {
                  "label": "询价",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "将项目的进度、成本、质量和范围作为项目管理的目标，这体现了项目管理的（）特点"
          },
          "answers": [
              {
                  "label": "多目标性",
                  "isCorrect": true
              },
              {
                  "label": "层次性",
                  "isCorrect": false
              },
              {
                  "label": "系统性",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "成本预算的输入不包括"
          },
          "answers": [
              {
                  "label": "成本基准",
                  "isCorrect": true
              },
              {
                  "label": "资源日历",
                  "isCorrect": false
              },
              {
                  "label": "风险登记册",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "在沟通管理中，一般（）是最有效的沟通并解决干系人之间问题的方法。"
          },
          "answers": [
              {
                  "label": "面对面会议",
                  "isCorrect": true
              },
              {
                  "label": "问题日志",
                  "isCorrect": false
              },
              {
                  "label": "问题清单",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "（）不属于风险管理计划编制的成果"
          },
          "answers": [
              {
                  "label": "风险类别",
                  "isCorrect": false
              },
              {
                  "label": "风险概率",
                  "isCorrect": false
              },
              {
                  "label": "风险记录",
                  "isCorrect": true
              }
          ]
      },
      {
          "question": {
              "label": "（）不属于项目团队建设的工具和技巧"
          },
          "answers": [
              {
                  "label": "事先分派",
                  "isCorrect": true
              },
              {
                  "label": "培训",
                  "isCorrect": false
              },
              {
                  "label": "集中办公",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "一般，项目计划主要关注项目的（）"
          },
          "answers": [
              {
                  "label": "活动计划",
                  "isCorrect": true
              },
              {
                  "label": "过程计划",
                  "isCorrect": false
              },
              {
                  "label": "组织计划",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "对大型复杂项目来说，必须优先考虑制定项目的（）。"
          },
          "answers": [
              {
                  "label": "活动计划",
                  "isCorrect": false
              },
              {
                  "label": "过程计划",
                  "isCorrect": true
              },
              {
                  "label": "资源计划",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "（）是控制范围常用的工具和技术"
          },
          "answers": [
              {
                  "label": "产品分析",
                  "isCorrect": false
              },
              {
                  "label": "偏差分析",
                  "isCorrect": false
              },
              {
                  "label": "标杆对照",
                  "isCorrect": true
              }
          ]
      },
      {
          "question": {
              "label": "项目经理对项目负责，其正式权利由（）获得。"
          },
          "answers": [
              {
                  "label": "项目工作说明书",
                  "isCorrect": false
              },
              {
                  "label": "成本管理计划",
                  "isCorrect": false
              },
              {
                  "label": "项目章程",
                  "isCorrect": true
              }
          ]
      },
      {
          "question": {
              "label": "质量管理工具（）常用于找出导致项目问题产生的潜在原因"
          },
          "answers": [
              {
                  "label": "控制图",
                  "isCorrect": false
              },
              {
                  "label": "鱼骨图",
                  "isCorrect": true
              },
              {
                  "label": "散点图",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "（）不属于项目人力资源管理的范畴"
          },
          "answers": [
              {
                  "label": "人员获取",
                  "isCorrect": false
              },
              {
                  "label": "入职培训",
                  "isCorrect": false
              },
              {
                  "label": "建立项目组织计划",
                  "isCorrect": true
              }
          ]
      },
      {
          "question": {
              "label": "下列（）不是传统项目生命周期的阶段。"
          },
          "answers": [
              {
                  "label": "开发阶段",
                  "isCorrect": false
              },
              {
                  "label": "概念阶段",
                  "isCorrect": true
              },
              {
                  "label": "系统分析",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "项目是实现组织（）的手段"
          },
          "answers": [
              {
                  "label": "文化",
                  "isCorrect": false
              },
              {
                  "label": "战略",
                  "isCorrect": true
              },
              {
                  "label": "架构",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "RFID射频技术多应用与物联网的（）"
          },
          "answers": [
              {
                  "label": "网络层",
                  "isCorrect": false
              },
              {
                  "label": "感知层",
                  "isCorrect": true
              },
              {
                  "label": "应用层",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "在信息系统的生命周期中、开发阶段不包括（）"
          },
          "answers": [
              {
                  "label": "系统规划",
                  "isCorrect": true
              },
              {
                  "label": "系统设计",
                  "isCorrect": false
              },
              {
                  "label": "系统分析",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "区块链的特征不包括（）"
          },
          "answers": [
              {
                  "label": "中心化",
                  "isCorrect": true
              },
              {
                  "label": "开发性",
                  "isCorrect": false
              },
              {
                  "label": "匿名性",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "（）不属于“互联网+”的应用"
          },
          "answers": [
              {
                  "label": "滴滴打车",
                  "isCorrect": false
              },
              {
                  "label": "AlhaGo",
                  "isCorrect": true
              },
              {
                  "label": "共享单车",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "质量保证成本属于质量成本中（）成本"
          },
          "answers": [
              {
                  "label": "一致性",
                  "isCorrect": true
              },
              {
                  "label": "非一致性",
                  "isCorrect": false
              },
              {
                  "label": "外部失败",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "PMGO看板页面能否按优先级分泳道"
          },
          "answers": [
              {
                  "label": "能",
                  "isCorrect": true
              },
              {
                  "label": "不能",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "PMGO任务单能否导出至excel"
          },
          "answers": [
              {
                  "label": "能",
                  "isCorrect": true
              },
              {
                  "label": "不能",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "PMGO能否按任务描述搜索任务单"
          },
          "answers": [
              {
                  "label": "能",
                  "isCorrect": true
              },
              {
                  "label": "不能",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "PMGO看板页面能否按项目成员分泳道"
          },
          "answers": [
              {
                  "label": "能",
                  "isCorrect": false
              },
              {
                  "label": "不能",
                  "isCorrect": true
              }
          ]
      },
      {
          "question": {
              "label": "PMGO项目访客可查看的任务单范围"
          },
          "answers": [
              {
                  "label": "全部任务单",
                  "isCorrect": false
              },
              {
                  "label": "仅参与的任务单",
                  "isCorrect": true
              }
          ]
      },
      {
          "question": {
              "label": "PMGO只读成员可查看的任务单范围"
          },
          "answers": [
              {
                  "label": "全部任务单",
                  "isCorrect": true
              },
              {
                  "label": "仅参与的任务单",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "PMGO任务单的字段\"截止时间\"能否设置为必填"
          },
          "answers": [
              {
                  "label": "能",
                  "isCorrect": true
              },
              {
                  "label": "不能",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "PMGO能否批量修改任务单的迭代"
          },
          "answers": [
              {
                  "label": "能",
                  "isCorrect": true
              },
              {
                  "label": "不能",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "PMGO能否给任务单加标签"
          },
          "answers": [
              {
                  "label": "能",
                  "isCorrect": true
              },
              {
                  "label": "不能",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "PMGO任务单能否加密"
          },
          "answers": [
              {
                  "label": "能",
                  "isCorrect": true
              },
              {
                  "label": "不能",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "PMGO任务单能否分别给各个职能打SP"
          },
          "answers": [
              {
                  "label": "能",
                  "isCorrect": true
              },
              {
                  "label": "不能",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "PMGO中待规划的任务单能否直接拖至已完成"
          },
          "answers": [
              {
                  "label": "能",
                  "isCorrect": true
              },
              {
                  "label": "不能",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "PMGO可以在中网访问么？"
          },
          "answers": [
              {
                  "label": "能",
                  "isCorrect": true
              },
              {
                  "label": "不能",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "PMGO报告标题能否修改"
          },
          "answers": [
              {
                  "label": "能",
                  "isCorrect": true
              },
              {
                  "label": "不能",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "PMGO中关闭了的迭代是否能重启"
          },
          "answers": [
              {
                  "label": "能",
                  "isCorrect": true
              },
              {
                  "label": "不能",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "创建任务单时，填写了内容但未保存，如何找回填写内容"
          },
          "answers": [
              {
                  "label": "下次创建任务单时加载草稿",
                  "isCorrect": true
              },
              {
                  "label": "找不回来了",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "如何快速查看与自己相关的任务单"
          },
          "answers": [
              {
                  "label": "看板中筛选“与我相关”",
                  "isCorrect": true
              },
              {
                  "label": "导出任务单查看",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "PMGO如何开启“测试用例”模块"
          },
          "answers": [
              {
                  "label": "在设置页面自行开启",
                  "isCorrect": true
              },
              {
                  "label": "联系PMGO系统策划人员",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "PMGO在哪里创建工单会话"
          },
          "answers": [
              {
                  "label": "任务详情中",
                  "isCorrect": true
              },
              {
                  "label": "设置页面中",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "火星聊天窗口中如何快创建PMGO任务单"
          },
          "answers": [
              {
                  "label": "选中文字，点击鼠标右键选中“添加到PMGO”",
                  "isCorrect": true
              },
              {
                  "label": "复制文字去PMGO系统中创建",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "PMGO任务单的参与人只允许一个人"
          },
          "answers": [
              {
                  "label": "对",
                  "isCorrect": false
              },
              {
                  "label": "错",
                  "isCorrect": true
              }
          ]
      },
      {
          "question": {
              "label": "PMGO任务单的备注不能添加GIF图"
          },
          "answers": [
              {
                  "label": "对",
                  "isCorrect": false
              },
              {
                  "label": "错",
                  "isCorrect": true
              }
          ]
      },
      {
          "question": {
              "label": "PMGO任务单不能添加附件"
          },
          "answers": [
              {
                  "label": "对",
                  "isCorrect": false
              },
              {
                  "label": "错",
                  "isCorrect": true
              }
          ]
      },
      {
          "question": {
              "label": "PMGO任务单能设置开始时间和截止时间"
          },
          "answers": [
              {
                  "label": "对",
                  "isCorrect": false
              },
              {
                  "label": "错",
                  "isCorrect": true
              }
          ]
      },
      {
          "question": {
              "label": "PMGO任务单导出时如何设置导出内容"
          },
          "answers": [
              {
                  "label": "需求页面中设置显示字段",
                  "isCorrect": true
              },
              {
                  "label": "设置页面中设置",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "PMGO报告标题能否修改"
          },
          "answers": [
              {
                  "label": "能",
                  "isCorrect": true
              },
              {
                  "label": "不能",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "PMGO看板中的任务卡片大小有几种规格"
          },
          "answers": [
              {
                  "label": "一种",
                  "isCorrect": false
              },
              {
                  "label": "两种",
                  "isCorrect": false
              },
              {
                  "label": "三种",
                  "isCorrect": true
              }
          ]
      },
      {
          "question": {
              "label": "PMGO中的任务单可以设置完成度么？"
          },
          "answers": [
              {
                  "label": "能",
                  "isCorrect": true
              },
              {
                  "label": "不能",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "PMGO中的任务单优先级可以自定义么？"
          },
          "answers": [
              {
                  "label": "能",
                  "isCorrect": true
              },
              {
                  "label": "不能",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "PMGO中的测试用例可以进行复制么？"
          },
          "answers": [
              {
                  "label": "能",
                  "isCorrect": false
              },
              {
                  "label": "不能",
                  "isCorrect": true
              }
          ]
      },
      {
          "question": {
              "label": "PMGO中的消息推送可以按个人喜好进行设置么？"
          },
          "answers": [
              {
                  "label": "能",
                  "isCorrect": true
              },
              {
                  "label": "不能",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "PMGO中卡片左侧的色条表示的是什么？"
          },
          "answers": [
              {
                  "label": "优先级",
                  "isCorrect": false
              },
              {
                  "label": "模块",
                  "isCorrect": true
              },
              {
                  "label": "版本",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "PMGO中卡片右上角的蓝色三角形表示的是什么？"
          },
          "answers": [
              {
                  "label": "与我相关",
                  "isCorrect": true
              },
              {
                  "label": "重点关注",
                  "isCorrect": false
              },
              {
                  "label": "加密任务",
                  "isCorrect": false
              }
          ]
      },
      {
          "question": {
              "label": "PMGO中一个测试用例可以关联几个任务单？"
          },
          "answers": [
              {
                  "label": "一个",
                  "isCorrect": false
              },
              {
                  "label": "两个",
                  "isCorrect": false
              },
              {
                  "label": "多个",
                  "isCorrect": true
              }
          ]
      },
      {
          "question": {
              "label": "PMGO中的测试用例可以有多少人验收？"
          },
          "answers": [
              {
                  "label": "一个",
                  "isCorrect": false
              },
              {
                  "label": "两个",
                  "isCorrect": false
              },
              {
                  "label": "多个",
                  "isCorrect": true
              }
          ]
      },
      {
          "question": {
              "label": "PMGO中是否支持任务单在各节点中的停留时长的统计"
          },
          "answers": [
              {
                  "label": "是",
                  "isCorrect": true
              },
              {
                  "label": "否",
                  "isCorrect": false
              }
          ]
      }
  ];

  const WIDTH = document.documentElement.clientWidth;
  const HEIGHT = 896 || document.documentElement.clientHeight;
  class Bird extends Phaser.Scene {
      constructor() {
          super('Bird');
      }
      preload() {
          this.load.image('ground', 'assets/ground.png');
          this.load.image('background', 'assets/background.png');
          this.load.image('pipe', 'assets/pipe.png');
          this.load.spritesheet('bird', 'assets/bird.png', {
              frameWidth: 92,
              frameHeight: 64,
              startFrame: 0,
              endFrame: 2
          });
      }
      create() {
          for (let i = 0; i < Math.ceil(WIDTH / 768); i++) {
              this.add.image(i * 768 + 384 - i, 320, 'background'); // 图片拼接会有间隙
          }
          let platforms = this.physics.add.staticGroup();
          for (let i = 0; i < Math.ceil(WIDTH / 36); i++) {
              platforms.create(16 + 36 * i, 832, 'ground');
          }
          platforms.setDepth(10);
          this.bird = this.physics.add.sprite(0, 0, 'bird');
          this.bird.setDepth(2);
          this.bird.setCollideWorldBounds(true);
          this.physics.add.collider(this.bird, platforms);
          this.anims.create({
              key: 'birdfly',
              frames: this.anims.generateFrameNumbers('bird', { start: 0, end: 2 }),
              frameRate: 10,
              repeat: -1
          });
          this.birdTween = this.tweens.add({
              targets: this.bird,
              delay: 300,
              duration: 500,
              ease: 'easeOut',
              paused: true,
              props: {
                  'angle': {
                      value: {
                          getStart() {
                              return -25;
                          },
                          getEnd() {
                              return 90;
                          }
                      }
                  }
              }
          });
          this.bird.play('birdfly');
          this.input.on('pointerdown', this.fly, this);
          // this.makePipes()
          this.initProblems();
          this.makeProblem();
      }
      update() {
      }
      start() {
      }
      makePipes() {
          let up = this.physics.add.image(1400, 300, 'pipe');
          up.setFlipY(true);
          let down = this.physics.add.image(400, 700, 'pipe');
          up.setGravityY(-2700); // 反重力
          down.setGravityY(-2700);
          up.setImmovable();
          down.setImmovable();
          down.setVelocityX(-200);
          up.setVelocityX(-200);
          this.physics.add.collider(this.bird, [down, up], () => {
              console.log(111);
          });
      }
      // about problems START
      initProblems() {
          this.problems = JSON.parse(JSON.stringify(problems));
      }
      makeProblem() {
          let problem = this.chooseProblem();
          this.makeQuestion(problem.question);
          this.makeAnswer(problem);
      }
      chooseProblem() {
          const index = Math.floor(Math.random() * this.problems.length);
          return this.problems.splice(index, 1)[0];
      }
      makeQuestion(question) {
          question.instance = this.add.text(WIDTH, HEIGHT / 2 - 60, question.label, {
              fontSize: '40px',
              color: '#000'
          });
          this.makeArcadeInstance(question.instance);
          this.physics.add.collider(this.bird, question.instance, () => {
              this.fly();
          });
      }
      makeAnswer(problem) {
          let { question, answers } = problem;
          answers.forEach((item, index) => {
              item.instance = this.add.text(WIDTH + question.label.length * 50, HEIGHT / (answers.length + 1) * (index + 1) - 100, item.label, {
                  fontSize: '20px',
                  color: '#000'
              });
              this.makeArcadeInstance(item.instance);
              this.physics.add.collider(this.bird, item.instance, () => {
                  if (item.isCorrect) {
                      console.log('正确');
                  }
                  else {
                      console.log('错误');
                  }
                  this.destroyProblem(problem);
                  this.makeProblem();
                  console.log('创建水管'); // todo 越过题目也要调用
              });
          });
      }
      makeArcadeInstance(instance) {
          this.physics.world.enable(instance);
          let body = instance.body;
          body.setAllowGravity(false);
          body.setImmovable();
          body.setVelocityX(-200);
      }
      destroyProblem(problem) {
          let { question, answers } = problem;
          question.instance.destroy();
          answers.forEach(item => item.instance.destroy());
      }
      // about problems END
      fly() {
          this.bird.setAngle(-25);
          this.birdTween.resume();
          this.birdTween.restart();
          this.bird.setVelocityY(-700);
      }
  }
  const config = {
      type: Phaser.AUTO,
      backgroundColor: '#ded895',
      scene: Bird,
      scale: {
          width: '100%',
          height: HEIGHT,
          mode: Phaser.Scale.ScaleModes.HEIGHT_CONTROLS_WIDTH,
          autoCenter: Phaser.Scale.CENTER_HORIZONTALLY
      },
      physics: {
          default: 'arcade',
          arcade: {
              gravity: { y: 2700 },
              debug: false
          }
      },
  };
  const game = new Phaser.Game(config);

  return Bird;

}());
//# sourceMappingURL=game.js.map
