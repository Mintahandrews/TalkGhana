import React, { useState, useEffect } from "react";
import { GhanaianLanguage } from "./GhanaianLanguageDatasetManager";
import {
  Button,
  Card,
  Tabs,
  Tab,
  Form,
  ProgressBar,
  Alert,
  Container,
  Row,
  Col,
  Table,
  Badge,
  Spinner,
  Modal,
  ListGroup,
  Accordion,
} from "react-bootstrap";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Configure chart options
const chartOptions = {
  responsive: true,
  plugins: {
    title: {
      display: true,
      text: "Training Progress",
    },
    legend: {
      position: "top" as const,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: "Loss",
      },
    },
    x: {
      title: {
        display: true,
        text: "Epoch",
      },
    },
  },
};

// Language-specific vocabulary
const languageVocabulary: Record<GhanaianLanguage, string[]> = {
  twi: [
    "<pad>",
    "<sos>",
    "<eos>",
    "akwaaba",
    "me da wo ase",
    "yoo",
    "aane",
    "daabi",
    "mepa wo kyɛw",
    "boa me",
    "da yie",
    "medaase",
    "wo ho te sɛn",
    "yɛfrɛ me",
  ],
  ga: [
    "<pad>",
    "<sos>",
    "<eos>",
    "ogekoo",
    "oyiwala don",
    "yoo",
    "ee",
    "daabi",
    "ofaine",
    "ye mi",
    "oyiwala",
    "ke oshee",
    "te oyaa",
    "atsɛ mi",
  ],
  ewe: [
    "<pad>",
    "<sos>",
    "<eos>",
    "woezor",
    "akpe",
    "yoo",
    "ɛe",
    "ao",
    "meɖekuku",
    "kpe ɖe ŋunye",
    "heyi",
    "akpe kakaka",
    "aleke nèfɔ",
    "woyɔam be",
  ],
  hausa: [
    "<pad>",
    "<sos>",
    "<eos>",
    "sannu",
    "na gode",
    "to",
    "ee",
    "a'a",
    "don Allah",
    "taimaka min",
    "sai anjima",
    "madalla",
    "yaya kake",
    "sunana",
  ],
  english: [
    "<pad>",
    "<sos>",
    "<eos>",
    "hello",
    "thank you",
    "okay",
    "yes",
    "no",
    "please",
    "help me",
    "goodbye",
    "welcome",
    "how are you",
    "my name is",
  ],
};

// Simulated training functions
const simulateTTSTraining = async (
  language: GhanaianLanguage,
  options: any
) => {
  return {
    modelPath: `/data/models/${language}/tts_model_${Date.now()}`,
    trainingHistory: {
      loss: [5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0, 1.8, 1.6, 1.5],
      val_loss: [5.5, 5.0, 4.5, 4.0, 3.5, 3.2, 2.9, 2.7, 2.5, 2.4],
    },
    metrics: {
      loss: 1.5,
      validationLoss: 2.4,
      melLoss: 0.5,
      durationLoss: 0.2,
    },
    trainingDuration: 3600,
    modelSize: 10 * 1024 * 1024,
    language,
  };
};

const simulateSTTTraining = async (
  language: GhanaianLanguage,
  options: any
) => {
  return {
    modelPath: `/data/models/${language}/stt_model_${Date.now()}`,
    trainingHistory: {
      loss: [5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0, 1.8, 1.6, 1.5],
      val_loss: [5.5, 5.0, 4.5, 4.0, 3.5, 3.2, 2.9, 2.7, 2.5, 2.4],
    },
    metrics: {
      loss: 1.5,
      validationLoss: 2.4,
      wordErrorRate: 0.25,
      characterErrorRate: 0.1,
    },
    trainingDuration: 4800,
    modelSize: 8 * 1024 * 1024,
    language,
    vocabulary: languageVocabulary[language],
  };
};

interface TrainingOptions {
  modelType: "transformer" | "lstm" | "cnn";
  batchSize: number;
  epochs: number;
  learningRate: number;
  usePretrainedEmbeddings?: boolean;
  syllableLevel?: boolean;
  speakerEmbeddingDim?: number;
  useTones?: boolean;
  melSpecConfig?: {
    melBands: number;
  };
  attentionHeads?: number;
  contextWindow?: number;
}

const TrainingInterface: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] =
    useState<GhanaianLanguage>("english");
  const [trainingType, setTrainingType] = useState<"tts" | "stt">("tts");
  const [trainingOptions, setTrainingOptions] = useState<TrainingOptions>({
    modelType: "transformer",
    batchSize: 32,
    epochs: 100,
    learningRate: 0.001,
    usePretrainedEmbeddings: true,
    syllableLevel: true,
    speakerEmbeddingDim: 64,
    useTones: true,
    melSpecConfig: {
      melBands: 80,
    },
    attentionHeads: 8,
    contextWindow: 150,
  });
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingResults, setTrainingResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartTraining = async () => {
    setIsTraining(true);
    setError(null);
    try {
      const result = await (trainingType === "tts"
        ? simulateTTSTraining(selectedLanguage, trainingOptions)
        : simulateSTTTraining(selectedLanguage, trainingOptions));

      setTrainingResults(result);
      setTrainingProgress(100);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred during training"
      );
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <Container className="py-4">
      <Card>
        <Card.Header>
          <h2>Ghanaian Language Model Training Interface</h2>
        </Card.Header>
        <Card.Body>
          <Tabs defaultActiveKey="settings" id="training-tabs">
            <Tab eventKey="settings" title="Training Settings">
              <Form className="mt-3">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Language</Form.Label>
                      <Form.Select
                        value={selectedLanguage}
                        onChange={(e) =>
                          setSelectedLanguage(
                            e.target.value as GhanaianLanguage
                          )
                        }
                      >
                        {Object.keys(languageVocabulary).map((lang) => (
                          <option key={lang} value={lang}>
                            {lang.charAt(0).toUpperCase() + lang.slice(1)}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Training Type</Form.Label>
                      <Form.Select
                        value={trainingType}
                        onChange={(e) =>
                          setTrainingType(e.target.value as "tts" | "stt")
                        }
                      >
                        <option value="tts">Text-to-Speech</option>
                        <option value="stt">Speech-to-Text</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Accordion className="mb-3">
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>Advanced Options</Accordion.Header>
                    <Accordion.Body>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Model Type</Form.Label>
                            <Form.Select
                              value={trainingOptions.modelType}
                              onChange={(e) =>
                                setTrainingOptions({
                                  ...trainingOptions,
                                  modelType: e.target
                                    .value as TrainingOptions["modelType"],
                                })
                              }
                            >
                              <option value="transformer">Transformer</option>
                              <option value="lstm">LSTM</option>
                              <option value="cnn">CNN</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Batch Size</Form.Label>
                            <Form.Control
                              type="number"
                              value={trainingOptions.batchSize}
                              onChange={(e) =>
                                setTrainingOptions({
                                  ...trainingOptions,
                                  batchSize: parseInt(e.target.value),
                                })
                              }
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>

                <Button
                  variant="primary"
                  onClick={handleStartTraining}
                  disabled={isTraining}
                >
                  {isTraining ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Training...
                    </>
                  ) : (
                    "Start Training"
                  )}
                </Button>
              </Form>
            </Tab>

            <Tab eventKey="progress" title="Training Progress">
              <div className="mt-3">
                {isTraining && (
                  <>
                    <ProgressBar animated now={trainingProgress} />
                    <p className="text-center mt-2">
                      {trainingProgress}% Complete
                    </p>
                  </>
                )}

                {error && (
                  <Alert variant="danger" className="mt-3">
                    {error}
                  </Alert>
                )}

                {trainingResults && (
                  <div className="mt-3">
                    <h4>Training Results</h4>
                    <Table striped bordered>
                      <tbody>
                        <tr>
                          <td>Model Path</td>
                          <td>{trainingResults.modelPath}</td>
                        </tr>
                        <tr>
                          <td>Training Duration</td>
                          <td>{trainingResults.trainingDuration}s</td>
                        </tr>
                        <tr>
                          <td>Model Size</td>
                          <td>
                            {(
                              trainingResults.modelSize /
                              (1024 * 1024)
                            ).toFixed(2)}{" "}
                            MB
                          </td>
                        </tr>
                      </tbody>
                    </Table>

                    <h5 className="mt-4">Training Metrics</h5>
                    <Line
                      data={{
                        labels: Array.from(
                          { length: 10 },
                          (_, i) => `Epoch ${i + 1}`
                        ),
                        datasets: [
                          {
                            label: "Loss",
                            data: trainingResults.trainingHistory.loss,
                            borderColor: "rgb(75, 192, 192)",
                            tension: 0.1,
                          },
                          {
                            label: "Validation Loss",
                            data: trainingResults.trainingHistory.val_loss,
                            borderColor: "rgb(255, 99, 132)",
                            tension: 0.1,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          title: {
                            display: true,
                            text: "Training Progress",
                          },
                        },
                      }}
                    />
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TrainingInterface;
