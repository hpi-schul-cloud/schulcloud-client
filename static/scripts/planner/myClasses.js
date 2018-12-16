import React from "react";
import ReactDOM from "react-dom";
import { ClassConfigurationView } from "planner-core-lib/lib/components/views/classConfiguration";
import { setupMaterialComponents } from "../../../helpers/planner";

const getTopicInstancesMap = allClassTopics => {
  const map = {};
  // Unpack object
  for (const schoolYearId in allClassTopics) {
    for (const subjectId in allClassTopics[schoolYearId].subjects) {
      for (const classLevelId in allClassTopics[schoolYearId].subjects[
        subjectId
      ].classLevels) {
        for (const classId in allClassTopics[schoolYearId].subjects[subjectId]
          .classLevels[classLevelId].classes) {
          for (const topicIndex in allClassTopics[schoolYearId].subjects[
            subjectId
          ].classLevels[classLevelId].classes[classId].topics) {
            const topicInstance =
              allClassTopics[schoolYearId].subjects[subjectId].classLevels[
                classLevelId
              ].classes[classId].topics[topicIndex];
            topicInstance.schoolYearId = schoolYearId;
            topicInstance.classId = classId;
            map[topicInstance.id] = topicInstance;
          }
        }
      }
    }
  }
  return map;
};

const WEEK = 1000 * 60 * 60 * 24 * 7;
const transformIndexToDate = (topicInstance, schoolYearData) => {
  const { schoolYearId, startIndex, endIndex } = topicInstance;
  const numberOfWeeks = endIndex - startIndex + 1;
  const schoolYearStart = schoolYearData[schoolYearId].utcStartDate;
  const utcStartDate = schoolYearStart + startIndex * WEEK;
  return {
    numberOfWeeks,
    utcStartDate
  };
};
const generateAPICommands = (
  oldTopicInstances,
  newTopicInstances,
  schoolYearData
) => {
  // We compare the old topic instances with the new ones to determine, which ones we have to
  // delete, patch or create
  const result = {
    create: [],
    patch: [],
    delete: []
  };
  const idSet = new Set(Object.keys(oldTopicInstances));
  for (const instanceId in newTopicInstances) {
    if (idSet.has(instanceId)) {
      idSet.delete(instanceId);
      // ID of topic instance already existed
      // -> either it was adjusted (position changed) and we have to patch it
      //    or it has not changed and we leave it
      if (
        newTopicInstances[instanceId].startIndex !==
          oldTopicInstances[instanceId].startIndex ||
        newTopicInstances[instanceId].endIndex !==
          oldTopicInstances[instanceId].endIndex
      ) {
        result.patch.push({
          _id: newTopicInstances[instanceId].id,
          ...transformIndexToDate(newTopicInstances[instanceId], schoolYearData)
        });
      }
    } else {
      result.create.push({
        parentTemplateId: newTopicInstances[instanceId].parentTemplateId,
        courseId: newTopicInstances[instanceId].classId,
        ...transformIndexToDate(newTopicInstances[instanceId], schoolYearData)
      });
    }
  }
  // All ids remaining in the set belong to topic instances that need to be deleted
  result.delete = [...idSet];

  return result;
};

class View extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      allClassTopics: this.props.allClassTopics,
      allTopicTemplates: this.props.allTopicTemplates
    };
  }
  redirectToAddTemplate = (subjectId, classLevelId) => {
    window.location = `/planner/topicTemplates/new?subjectId=${subjectId}&classLevelId=${classLevelId}`;
  };
  redirectToEditTemplate = templateId => {
    window.location = `/planner/topicTemplates/${templateId}`;
  };
  redirectToEditInstance = instanceId => {
    window.location = `/planner/topicInstances/${instanceId}`;
  };
  handleDeleteTemplate = (subjectId, classLevelId, templateId) => {
    $.ajax({
      type: "DELETE",
      url: `/planner/topicTemplates/${templateId}`,
      success: () => {
        // If deletion was successful we remove the template from the local state
        const newTopicTemplates = {
          ...this.state.allTopicTemplates,
          [subjectId]: {
            ...this.state.allTopicTemplates[subjectId],
            [classLevelId]: this.state.allTopicTemplates[subjectId][
              classLevelId
            ].filter(template => template.id !== templateId)
          }
        };
        this.setState({
          allTopicTemplates: newTopicTemplates
        });
      }
    });
  };
  handleSaveClassIntances = topicInstances => {
    const existingTopicInstancesMap = getTopicInstancesMap(
      this.state.allClassTopics
    );
    const newTopicInstancesMap = getTopicInstancesMap(topicInstances);
    const apiCommands = generateAPICommands(
      existingTopicInstancesMap,
      newTopicInstancesMap,
      this.props.schoolYearData
    );
    $.ajax({
      type: "POST",
      url: "/planner/myClasses",
      data: apiCommands,
      success: data => {
        this.setState({
          allClassTopics: data
        });
      }
    });
  };

  render() {
    return (
      <ClassConfigurationView
        initialSchoolYearId={this.props.initialSchoolYearId}
        schoolYearData={this.props.schoolYearData}
        eventData={this.props.eventData}
        allClassTopics={this.state.allClassTopics}
        allTopicTemplates={this.state.allTopicTemplates}
        onAddTemplate={this.redirectToAddTemplate}
        onEditTemplate={this.redirectToEditTemplate}
        onDeleteTemplate={this.handleDeleteTemplate}
        onEditInstance={this.redirectToEditInstance}
        onSaveClassInstances={this.handleSaveClassIntances}
      />
    );
  }
}

/**
 * Render the React root into a <div> of the current page.
 */
setupMaterialComponents();
const $reactRoot = $("#react-root");
const data = $reactRoot.data();

ReactDOM.render(
  <View
    schoolYearData={data.schoolyeardata}
    initialSchoolYearId={data.initialschoolyearid}
    eventData={data.eventdata}
    allClassTopics={data.allclasstopics}
    allTopicTemplates={data.alltopictemplates}
  />,
  $reactRoot[0]
);
